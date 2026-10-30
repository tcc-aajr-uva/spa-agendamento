import "server-only";
import { z } from "zod";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";
import { carregarAgendamentoAtivo, PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { escolherSala } from "@/lib/agendamento/criar-agendamento";
import { chaveSala, DIAS_DA_SEMANA, formatarHora, hojeNoBrasil } from "@/lib/agendamento/regras";

export type HorarioParaTransferencia = {
  id: string;
  diaSemana: number;
  horaInicio: number;
  estagiarioNome: string;
};

const transferenciaSchema = z.object({
  horarioDisponivelId: z.string().min(1, "Escolha o novo estagiário e horário."),
});

type Destino = { unidadeId: string; equipeId: string; estagiarioId: string };

async function carregarPeriodoId(tx: Transacao, unidadeId: string, agora: Date): Promise<string> {
  const periodo = await tx.periodoLetivo.findFirst({
    where: { unidadeId, fim: { gte: hojeNoBrasil(agora) } },
    orderBy: { inicio: "asc" },
    select: { id: true },
  });
  if (!periodo) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há período letivo aberto nesta unidade.");
  return periodo.id;
}

function horariosDaEquipe(destino: Destino, periodoLetivoId: string) {
  const { unidadeId, equipeId } = destino;
  return {
    ativo: true,
    estagiarioId: { not: destino.estagiarioId },
    estagiario: {
      perfil: "ESTAGIARIO" as const,
      ativo: true,
      configuracoesAtendimento: { some: { unidadeId, equipeId, periodoLetivoId, liberado: true, vinculoEquipe: { ativo: true } } },
    },
  };
}

function dadosDoHorario(destino: Destino, periodoLetivoId: string) {
  const { unidadeId, equipeId } = destino;
  return {
    id: true,
    diaSemana: true,
    horaInicio: true,
    estagiarioId: true,
    estagiario: {
      select: {
        nome: true,
        configuracoesAtendimento: {
          where: { unidadeId, equipeId, periodoLetivoId, liberado: true },
          take: 1,
          select: { limitePacientes: true },
        },
      },
    },
  };
}

async function contarAtivos(tx: Transacao, estagiarioIds: string[]): Promise<Map<string, number>> {
  const carga = await tx.agendamento.groupBy({
    by: ["estagiarioId"],
    where: { estagiarioId: { in: estagiarioIds }, horarioAtivoId: { not: null } },
    _count: { _all: true },
  });
  return new Map(carga.map((linha) => [linha.estagiarioId, linha._count._all]));
}

function abaixoDoLimite(
  horario: { estagiarioId: string; estagiario: { configuracoesAtendimento: { limitePacientes: number }[] } },
  ativos: Map<string, number>,
): boolean {
  const limite = horario.estagiario.configuracoesAtendimento[0]?.limitePacientes ?? 0;
  return (ativos.get(horario.estagiarioId) ?? 0) < limite;
}

export async function listarHorariosParaTransferencia(
  agendamentoId: string,
  usuario: ContextoAutorizacao,
  agora = new Date(),
): Promise<HorarioParaTransferencia[]> {
  const agendamento = await carregarAgendamentoAtivo(prisma, agendamentoId, usuario, PERFIS_DA_SECRETARIA);
  const periodoLetivoId = await carregarPeriodoId(prisma, agendamento.unidadeId, agora);
  const horarios = await prisma.horarioDisponivel.findMany({
    where: { ...horariosDaEquipe(agendamento, periodoLetivoId), ocupadoPor: { is: null } },
    orderBy: [{ estagiario: { nome: "asc" } }, { diaSemana: "asc" }, { horaInicio: "asc" }],
    select: dadosDoHorario(agendamento, periodoLetivoId),
  });
  const ativos = await contarAtivos(prisma, [...new Set(horarios.map((horario) => horario.estagiarioId))]);

  return horarios
    .filter((horario) => abaixoDoLimite(horario, ativos))
    .map((horario) => ({ id: horario.id, diaSemana: horario.diaSemana, horaInicio: horario.horaInicio, estagiarioNome: horario.estagiario.nome }));
}

export async function transferirAgendamento(
  agendamentoId: string,
  horarioDisponivelId: string,
  usuario: ContextoAutorizacao,
  agora = new Date(),
): Promise<void> {
  const dados = transferenciaSchema.safeParse({ horarioDisponivelId });
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  try {
    await executarEmTransacao((tx) => transferirNaTransacao(tx, agendamentoId, dados.data.horarioDisponivelId, usuario, agora));
  } catch (erro) {
    if (violouUnicidade(erro)) throw new ErroDeRegra("HORARIO_OCUPADO", "Este horário acabou de ser ocupado. Escolha outro.");
    throw erro;
  }
}

async function transferirNaTransacao(
  tx: Transacao,
  agendamentoId: string,
  horarioDisponivelId: string,
  usuario: ContextoAutorizacao,
  agora: Date,
): Promise<void> {
  const agendamento = await carregarAgendamentoAtivo(tx, agendamentoId, usuario, PERFIS_DA_SECRETARIA);
  if (agendamento.status !== "CONFIRMADO") {
    throw new ErroDeRegra("STATUS_INVALIDO", "Só é possível transferir um atendimento confirmado.");
  }

  const periodoLetivoId = await carregarPeriodoId(tx, agendamento.unidadeId, agora);
  const horario = await tx.horarioDisponivel.findFirst({
    where: { ...horariosDaEquipe(agendamento, periodoLetivoId), id: horarioDisponivelId },
    select: dadosDoHorario(agendamento, periodoLetivoId),
  });
  if (!horario) throw new ErroDeRegra("NAO_ENCONTRADO", "Horário não encontrado entre os estagiários desta equipe.");

  const ativos = await contarAtivos(tx, [horario.estagiarioId]);
  if (!abaixoDoLimite(horario, ativos)) {
    throw new ErroDeRegra("HORARIO_OCUPADO", "O estagiário escolhido já atingiu o limite de pacientes.");
  }

  const mesmoHorario = horario.diaSemana === agendamento.diaSemana && horario.horaInicio === agendamento.horaInicio;
  const salaId = mesmoHorario ? agendamento.salaId : await escolherSala(tx, agendamento.unidadeId, horario.diaSemana, horario.horaInicio);
  const anterior = await tx.usuario.findUnique({ where: { id: agendamento.estagiarioId }, select: { nome: true } });

  await tx.agendamento.update({
    where: { id: agendamentoId },
    data: {
      estagiarioId: horario.estagiarioId,
      horarioDisponivelId: horario.id,
      horarioAtivoId: horario.id,
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      salaId,
      salaAtivaChave: chaveSala(salaId, horario.diaSemana, horario.horaInicio),
      eventos: {
        create: {
          tipo: "TRANSFERIDO",
          usuarioId: usuario.id,
          observacao: `De ${anterior?.nome ?? "estagiário anterior"} para ${horario.estagiario.nome}, ${DIAS_DA_SEMANA[horario.diaSemana]} às ${formatarHora(horario.horaInicio)}`,
        },
      },
    },
  });
}
