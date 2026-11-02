import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { horarioNaGrade } from "@/lib/agendamento/regras";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
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
  await garantirNomeDisponivel(dados.nome);

  try {
    const unidade = await prisma.unidade.create({ data: dados, select: { id: true } });
    return unidade.id;
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
): Promise<void> {
  const dados = validar(entrada);
  try {
    await executarEmTransacao(async (tx) => {
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
        throw conflitoDeAtualizacao();
      }

      validarCamposDaSecretaria(autor, unidade, dados);
      await garantirNomeDisponivel(dados.nome, unidade.id, tx);
      await validarHorariosAtivosNaGrade(tx, unidade, dados);
      const atualizacao = await tx.unidade.updateMany({
        where: { id: unidade.id, atualizadoEm: versao },
        data: dados,
      });
      if (atualizacao.count !== 1) throw conflitoDeAtualizacao();
    });
  } catch (erro) {
    tratarNomeRepetido(erro);
    throw erro;
  }
}

function conflitoDeAtualizacao(): ErroDeRegra {
  return new ErroDeRegra(
    "CONFLITO_CONCORRENTE",
    "Esta unidade foi alterada em outra sessão. Carregue a versão mais recente antes de salvar novamente.",
  );
}

export async function alterarAtivacaoUnidade(
  unidadeId: string,
  ativa: boolean,
  autor: ContextoAutorizacao,
): Promise<void> {
  if (!podeAlterarAtivacaoDeUnidade(autor)) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Somente o administrador pode alterar a situação da unidade.");
  }
  const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId }, select: { id: true, ativa: true } });
  if (!unidade) throw new ErroDeRegra("NAO_ENCONTRADO", "Unidade não encontrada.");
  if (unidade.ativa === ativa) return;
  await prisma.unidade.update({ where: { id: unidade.id }, data: { ativa } });
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
  nome: string,
  ignorarId?: string,
  cliente: Pick<Transacao, "unidade"> = prisma,
): Promise<void> {
  const repetida = await cliente.unidade.findFirst({
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
