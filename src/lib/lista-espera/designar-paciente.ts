import "server-only";
import { z } from "zod";
import type { Turno } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { dadosPacienteSchema } from "@/lib/paciente/dados-paciente";
import { salvarPaciente } from "@/lib/paciente/salvar-paciente";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";
import { garantirPacienteSemVinculoAtivo } from "@/lib/agendamento/autorizacao";
import { liberarPendentesVencidos } from "@/lib/agendamento/liberar-agendamento";
import { hojeNoBrasil } from "@/lib/agendamento/regras";
import { contarCarga } from "@/lib/lista-espera/carga";
import { PERFIS_QUE_DESIGNAM } from "@/lib/lista-espera/inscricao";

const designacaoSchema = z.object({
  equipeId: z.string().min(1, "Escolha a equipe."),
  estagiarioId: z.string().min(1, "Escolha o estagiário."),
  paciente: dadosPacienteSchema,
});

export type Designacao = z.input<typeof designacaoSchema>;

export type EstagiarioParaDesignar = {
  id: string;
  nome: string;
  preferencias: { diaSemana: number; turno: Turno }[];
  ocupados: number;
  limite: number;
};

export type EquipeParaDesignar = {
  id: string;
  nome: string;
  estagiarios: EstagiarioParaDesignar[];
};

export async function listarEquipesParaDesignar(usuario: ContextoAutorizacao, agora = new Date()): Promise<EquipeParaDesignar[]> {
  if (!PERFIS_QUE_DESIGNAM.includes(usuario.perfil)) return [];

  const equipes = await prisma.equipe.findMany({
    where: { ativa: true, unidade: { ativa: true }, ...(usuario.perfil === "SUPERVISOR" ? { supervisorId: usuario.id } : {}) },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, unidadeId: true, unidade: { select: { nome: true } } },
  });
  if (equipes.length === 0) return [];

  const periodos = await prisma.periodoLetivo.findMany({
    where: { unidadeId: { in: [...new Set(equipes.map((equipe) => equipe.unidadeId))] }, fim: { gte: hojeNoBrasil(agora) } },
    orderBy: { inicio: "asc" },
    select: { id: true, unidadeId: true },
  });
  const periodoAtual = new Map<string, string>();
  for (const periodo of periodos) if (!periodoAtual.has(periodo.unidadeId)) periodoAtual.set(periodo.unidadeId, periodo.id);

  const configuracoes = await prisma.configuracaoAtendimentoEstagiario.findMany({
    where: {
      equipeId: { in: equipes.map((equipe) => equipe.id) },
      periodoLetivoId: { in: [...periodoAtual.values()] },
      ...filtroDeEstagiarioLiberado(),
    },
    orderBy: { estagiario: { nome: "asc" } },
    select: {
      equipeId: true,
      limitePacientes: true,
      estagiario: { select: { id: true, nome: true, preferencias: { orderBy: [{ diaSemana: "asc" }, { turno: "asc" }], select: { diaSemana: true, turno: true } } } },
    },
  });
  const carga = await contarCarga(prisma, [...new Set(configuracoes.map((configuracao) => configuracao.estagiario.id))]);

  return equipes.map((equipe) => ({
    id: equipe.id,
    nome: `${equipe.unidade.nome} / ${equipe.nome}`,
    estagiarios: configuracoes
      .filter((configuracao) => configuracao.equipeId === equipe.id)
      .map(({ estagiario, limitePacientes }) => ({
        id: estagiario.id,
        nome: estagiario.nome,
        preferencias: estagiario.preferencias,
        ocupados: carga.get(estagiario.id) ?? 0,
        limite: limitePacientes,
      })),
  }));
}

export async function designarPaciente(entrada: Designacao, usuario: ContextoAutorizacao, agora = new Date()): Promise<{ posicao: number }> {
  if (!PERFIS_QUE_DESIGNAM.includes(usuario.perfil)) throw new ErroDeRegra("SEM_PERMISSAO", "Só o supervisor da equipe cadastra pacientes.");
  const dados = designacaoSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  try {
    return await executarEmTransacao((tx) => designarNaTransacao(tx, dados.data, usuario, agora));
  } catch (erro) {
    if (violouUnicidade(erro, "pacienteAtivoId")) {
      throw new ErroDeRegra("PACIENTE_JA_ATIVO", "Este CPF já tem um agendamento ativo ou uma posição na lista de espera.");
    }
    throw erro;
  }
}

async function designarNaTransacao(
  tx: Transacao,
  { equipeId, estagiarioId, paciente }: z.output<typeof designacaoSchema>,
  usuario: ContextoAutorizacao,
  agora: Date,
): Promise<{ posicao: number }> {
  const equipe = await tx.equipe.findFirst({
    where: { id: equipeId, ativa: true, unidade: { ativa: true }, ...(usuario.perfil === "SUPERVISOR" ? { supervisorId: usuario.id } : {}) },
    select: { unidadeId: true },
  });
  if (!equipe) throw new ErroDeRegra("SEM_PERMISSAO", "Você não supervisiona esta equipe.");

  const periodo = await tx.periodoLetivo.findFirst({
    where: { unidadeId: equipe.unidadeId, fim: { gte: hojeNoBrasil(agora) } },
    orderBy: { inicio: "asc" },
    select: { id: true },
  });
  if (!periodo) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há período letivo aberto nesta unidade.");

  const configuracao = await tx.configuracaoAtendimentoEstagiario.findFirst({
    where: { estagiarioId, equipeId, periodoLetivoId: periodo.id, ...filtroDeEstagiarioLiberado() },
    select: { limitePacientes: true },
  });
  if (!configuracao) throw new ErroDeRegra("NAO_ENCONTRADO", "Estagiário não liberado nesta equipe no período atual.");

  const ocupados = (await contarCarga(tx, [estagiarioId])).get(estagiarioId) ?? 0;
  if (ocupados >= configuracao.limitePacientes) {
    throw new ErroDeRegra("SEM_VAGA", "Este estagiário já atingiu o limite de pacientes. Escolha outro.");
  }

  await liberarPendentesVencidos(tx, { paciente: { cpf: paciente.cpf } }, agora);
  await garantirPacienteSemVinculoAtivo(tx, paciente.cpf);
  const { id: pacienteId } = await salvarPaciente(tx, paciente);

  await tx.listaEspera.create({
    data: { unidadeId: equipe.unidadeId, equipeId, estagiarioId, designadoPorId: usuario.id, pacienteId, pacienteAtivoId: pacienteId, inscritoEm: agora },
  });
  const posicao = await tx.listaEspera.count({ where: { estagiarioId, status: "AGUARDANDO", inscritoEm: { lte: agora } } });
  return { posicao };
}

function filtroDeEstagiarioLiberado() {
  return {
    liberado: true,
    vinculoEquipe: { ativo: true },
    estagiario: { perfil: "ESTAGIARIO" as const, ativo: true },
  };
}
