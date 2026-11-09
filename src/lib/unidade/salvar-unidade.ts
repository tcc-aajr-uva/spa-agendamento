import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { horarioNaGrade } from "@/lib/agendamento/regras";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao, violouUnicidade } from "@/lib/transacao";
import { dadosUnidadeSchema, type DadosUnidade } from "@/lib/unidade/dados-unidade";
import {
  filtroDeUnidadesGerenciaveis,
  podeAlterarAtivacaoDeUnidade,
  podeCriarUnidade,
} from "@/lib/unidade/escopo-unidade";

export async function criarUnidade(entrada: DadosUnidade, autor: ContextoAutorizacao): Promise<string> {
  if (!podeCriarUnidade(autor)) throw new ErroDeRegra("SEM_PERMISSAO", "Somente o administrador pode criar unidades.");
  const dados = validar(entrada);

  try {
    return await executarEmTransacao(async (tx) => {
      await garantirNomeDisponivel(tx, dados.nome);
      const unidade = await tx.unidade.create({ data: dados, select: { id: true } });
      return unidade.id;
    });
  } catch (erro) {
    tratarNomeRepetido(erro);
    throw erro;
  }
}

export async function atualizarUnidade(
  unidadeId: string,
  entrada: DadosUnidade,
  versao: Date,
  autor: ContextoAutorizacao,
): Promise<Date> {
  const dados = validar(entrada);
  try {
    return await executarEmTransacao(async (tx) => {
      const unidade = await tx.unidade.findFirst({
        where: { id: unidadeId, AND: [filtroDeUnidadesGerenciaveis(autor)] },
        select: {
          id: true,
          nome: true,
          permitePaciente: true,
          permiteEstagiario: true,
          permiteSecretaria: true,
          horaAbertura: true,
          horaFechamento: true,
          duracaoBlocoMin: true,
          atualizadoEm: true,
        },
      });
      if (!unidade) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar esta unidade.");
      if (unidade.atualizadoEm.getTime() !== versao.getTime()) {
        throw new VersaoDesatualizadaDaUnidade();
      }

      validarCamposDaSecretaria(autor, unidade, dados);
      await garantirNomeDisponivel(tx, dados.nome, unidade.id);
      await validarHorariosAtivosNaGrade(tx, unidade, dados);
      const atualizacao = await tx.unidade.updateMany({
        where: { id: unidade.id, atualizadoEm: versao },
        data: dados,
      });
      if (atualizacao.count !== 1) throw new VersaoDesatualizadaDaUnidade();
      const unidadeAtualizada = await tx.unidade.findUniqueOrThrow({
        where: { id: unidade.id },
        select: { atualizadoEm: true },
      });
      return unidadeAtualizada.atualizadoEm;
    });
  } catch (erro) {
    tratarNomeRepetido(erro);
    throw erro;
  }
}

export class VersaoDesatualizadaDaUnidade extends ErroDeRegra {
  constructor() {
    super("CONFLITO_CONCORRENTE", "Esta unidade foi alterada em outra sessão.");
  }
}

export async function alterarAtivacaoUnidade(
  unidadeId: string,
  ativa: boolean,
  versao: Date,
  autor: ContextoAutorizacao,
): Promise<Date> {
  if (!podeAlterarAtivacaoDeUnidade(autor)) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Somente o administrador pode alterar a situação da unidade.");
  }
  return executarEmTransacao(async (tx) => {
    const unidade = await tx.unidade.findUnique({
      where: { id: unidadeId },
      select: { ativa: true, atualizadoEm: true },
    });
    if (!unidade) throw new ErroDeRegra("NAO_ENCONTRADO", "Unidade não encontrada.");
    if (unidade.atualizadoEm.getTime() !== versao.getTime()) throw new VersaoDesatualizadaDaUnidade();
    if (unidade.ativa === ativa) return unidade.atualizadoEm;

    const atualizacao = await tx.unidade.updateMany({
      where: { id: unidadeId, atualizadoEm: versao },
      data: { ativa },
    });
    if (atualizacao.count !== 1) throw new VersaoDesatualizadaDaUnidade();

    const unidadeAtualizada = await tx.unidade.findUniqueOrThrow({
      where: { id: unidadeId },
      select: { atualizadoEm: true },
    });
    return unidadeAtualizada.atualizadoEm;
  });
}

function validar(entrada: DadosUnidade) {
  const resultado = dadosUnidadeSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }
  return resultado.data;
}

function tratarNomeRepetido(erro: unknown): void {
  if (violouUnicidade(erro, "nome")) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Já existe uma unidade com este nome.");
  }
}

async function garantirNomeDisponivel(
  tx: Transacao,
  nome: string,
  ignorarId?: string,
): Promise<void> {
  const repetida = await tx.unidade.findFirst({
    where: {
      nome: { equals: nome, mode: "insensitive" },
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
    select: { id: true },
  });
  if (repetida) throw new ErroDeRegra("DADOS_INVALIDOS", "Já existe uma unidade com este nome.");
}

function validarCamposDaSecretaria(
  autor: ContextoAutorizacao,
  unidade: {
    nome: string;
    permitePaciente: boolean;
    permiteEstagiario: boolean;
    permiteSecretaria: boolean;
  },
  dados: DadosUnidade,
): void {
  if (
    autor.perfil === "SECRETARIA" &&
    (dados.nome !== unidade.nome ||
      dados.permitePaciente !== unidade.permitePaciente ||
      dados.permiteEstagiario !== unidade.permiteEstagiario ||
      dados.permiteSecretaria !== unidade.permiteSecretaria)
  ) {
    throw new ErroDeRegra(
      "SEM_PERMISSAO",
      "Somente a coordenação ou o administrador pode alterar o nome e quem pode agendar.",
    );
  }
}

async function validarHorariosAtivosNaGrade(
  tx: Transacao,
  unidade: {
    id: string;
    horaAbertura: number;
    horaFechamento: number;
    duracaoBlocoMin: number;
  },
  dados: DadosUnidade,
): Promise<void> {
  const gradeAlterada =
    dados.horaAbertura !== unidade.horaAbertura ||
    dados.horaFechamento !== unidade.horaFechamento ||
    dados.duracaoBlocoMin !== unidade.duracaoBlocoMin;
  if (!gradeAlterada) return;

  const horarios = await tx.horarioDisponivel.findMany({
    where: {
      ativo: true,
      estagiario: {
        perfil: "ESTAGIARIO",
        unidades: { some: { unidadeId: unidade.id, ativo: true } },
      },
    },
    select: { horaInicio: true },
  });
  if (horarios.some(({ horaInicio }) => !horarioNaGrade(dados, horaInicio))) {
    throw new ErroDeRegra(
      "DADOS_INVALIDOS",
      "Existem horários ativos fora da nova grade. Ajuste ou remova esses horários antes de alterar o funcionamento.",
    );
  }
}
