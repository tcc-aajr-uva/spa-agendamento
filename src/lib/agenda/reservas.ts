import "server-only";
import { escolherSala } from "@/lib/agendamento/criar-agendamento";
import { liberarAgendamento, liberarPendentesVencidos } from "@/lib/agendamento/liberar-agendamento";
import { chaveSala, DIAS_DA_SEMANA, filtroAgendamentoAtivo, formatarHora, hojeNoBrasil, primeiraDataNoDia } from "@/lib/agendamento/regras";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";

const HORARIO_INDISPONIVEL = "Este horário não está mais disponível. Escolha outro.";

export type Remarcacao = { diaSemana: number; horaInicio: number; sala: string };

export async function cancelarReservaDoEstagiario(usuario: ContextoAutorizacao, agendamentoId: string): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const reserva = await tx.agendamento.findFirst({
      where: { id: agendamentoId, estagiarioId: usuario.id, horarioAtivoId: { not: null } },
      select: { id: true },
    });
    if (!reserva) throw new ErroDeRegra("NAO_ENCONTRADO", "Reserva não encontrada ou já encerrada.");

    await liberarAgendamento(reserva.id, { status: "CANCELADO", motivo: "CANCELADO_PELO_ESTAGIARIO", usuarioId: usuario.id }, tx);
  });
}

export async function remarcarReservaDoEstagiario(usuario: ContextoAutorizacao, agendamentoId: string, horarioId: string): Promise<Remarcacao> {
  try {
    return await executarEmTransacao((tx) => remarcarNaTransacao(tx, usuario, agendamentoId, horarioId, new Date()));
  } catch (erro) {
    if (violouUnicidade(erro)) throw new ErroDeRegra("HORARIO_OCUPADO", HORARIO_INDISPONIVEL);
    throw erro;
  }
}

async function remarcarNaTransacao(tx: Transacao, usuario: ContextoAutorizacao, agendamentoId: string, horarioId: string, agora: Date): Promise<Remarcacao> {
  await liberarPendentesVencidos(tx, { unidadeId: { in: usuario.unidades } }, agora);

  const reserva = await tx.agendamento.findFirst({
    where: { id: agendamentoId, estagiarioId: usuario.id, ...filtroAgendamentoAtivo(agora) },
    select: { id: true, unidadeId: true, horarioDisponivelId: true, diaSemana: true, horaInicio: true, dataInicio: true, dataFim: true },
  });
  if (!reserva) throw new ErroDeRegra("NAO_ENCONTRADO", "Reserva não encontrada ou já encerrada.");

  const horario = await tx.horarioDisponivel.findFirst({
    where: { id: horarioId, estagiarioId: usuario.id, ativo: true },
    select: { id: true, diaSemana: true, horaInicio: true, ocupadoPor: { select: { id: true } } },
  });
  if (!horario) throw new ErroDeRegra("NAO_ENCONTRADO", "Horário não encontrado.");
  if (horario.id === reserva.horarioDisponivelId) throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um horário diferente do atual.");
  if (horario.ocupadoPor) throw new ErroDeRegra("HORARIO_OCUPADO", HORARIO_INDISPONIVEL);

  const { diaSemana, horaInicio } = horario;
  const salaId = await escolherSala(tx, reserva.unidadeId, diaSemana, horaInicio);
  const dataInicio = await novaDataDeInicio(tx, reserva, diaSemana, agora);

  const atualizado = await tx.agendamento.update({
    where: { id: reserva.id },
    data: {
      horarioDisponivelId: horario.id,
      horarioAtivoId: horario.id,
      diaSemana,
      horaInicio,
      salaId,
      salaAtivaChave: chaveSala(salaId, diaSemana, horaInicio),
      dataInicio,
      eventos: {
        create: {
          tipo: "REMARCADO",
          usuarioId: usuario.id,
          observacao: `${descrever(reserva.diaSemana, reserva.horaInicio)} → ${descrever(diaSemana, horaInicio)}, todas as semanas`,
        },
      },
    },
    select: { sala: { select: { nome: true } } },
  });

  return { diaSemana, horaInicio, sala: atualizado.sala.nome };
}

async function novaDataDeInicio(
  tx: Transacao,
  reserva: { unidadeId: string; dataInicio: Date; dataFim: Date },
  diaSemana: number,
  agora: Date,
): Promise<Date> {
  const hoje = hojeNoBrasil(agora);
  if (reserva.dataInicio <= hoje) return reserva.dataInicio;

  const periodo = await tx.periodoLetivo.findFirst({
    where: { unidadeId: reserva.unidadeId, fim: { gte: hoje } },
    orderBy: { inicio: "asc" },
    select: { inicio: true },
  });
  const aPartirDe = periodo && periodo.inicio > hoje ? periodo.inicio : hoje;
  const dataInicio = primeiraDataNoDia(diaSemana, aPartirDe);
  if (dataInicio > reserva.dataFim) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há mais datas neste período letivo.");
  return dataInicio;
}

function descrever(diaSemana: number, horaInicio: number): string {
  return `${DIAS_DA_SEMANA[diaSemana]} ${formatarHora(horaInicio)}`;
}
