import "server-only";
import { descreverHorario } from "@/lib/agenda/horarios";
import { carregarUnidadeParaAgendar } from "@/lib/agendamento/autorizacao";
import { horarioComSalaSchema, traduzirUnicidade, validarSalaNoHorario, type HorarioComSala } from "@/lib/agendamento/criar-agendamento";
import { liberarAgendamento, liberarPendentesVencidos } from "@/lib/agendamento/liberar-agendamento";
import { chaveEstagiario, chaveSala, FILTRO_RESERVA_ATIVA, filtroAgendamentoAtivo, hojeNoBrasil, primeiraDataNoDia } from "@/lib/agendamento/regras";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";

export type Remarcacao = { diaSemana: number; horaInicio: number; sala: string };

export async function cancelarReservaDoEstagiario(usuario: ContextoAutorizacao, agendamentoId: string): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const reserva = await tx.agendamento.findFirst({
      where: { id: agendamentoId, estagiarioId: usuario.id, ...FILTRO_RESERVA_ATIVA },
      select: { id: true },
    });
    if (!reserva) throw new ErroDeRegra("NAO_ENCONTRADO", "Reserva não encontrada ou já encerrada.");

    await liberarAgendamento(reserva.id, { status: "CANCELADO", motivo: "CANCELADO_PELO_ESTAGIARIO", usuarioId: usuario.id }, tx);
  });
}

export async function remarcarReservaDoEstagiario(usuario: ContextoAutorizacao, agendamentoId: string, novo: HorarioComSala): Promise<Remarcacao> {
  const dados = horarioComSalaSchema.safeParse(novo);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");
  try {
    return await executarEmTransacao((tx) => remarcarNaTransacao(tx, usuario, agendamentoId, dados.data, new Date()));
  } catch (erro) {
    throw traduzirUnicidade(erro);
  }
}

async function remarcarNaTransacao(
  tx: Transacao,
  usuario: ContextoAutorizacao,
  agendamentoId: string,
  { diaSemana, horaInicio, salaId }: { diaSemana: number; horaInicio: number; salaId: string },
  agora: Date,
): Promise<Remarcacao> {
  await liberarPendentesVencidos(tx, { unidadeId: { in: usuario.unidades } }, agora);

  const reserva = await tx.agendamento.findFirst({
    where: { id: agendamentoId, estagiarioId: usuario.id, ...filtroAgendamentoAtivo(agora) },
    select: { id: true, unidadeId: true, equipeId: true, salaId: true, diaSemana: true, horaInicio: true, dataInicio: true, dataFim: true },
  });
  if (!reserva) throw new ErroDeRegra("NAO_ENCONTRADO", "Reserva não encontrada ou já encerrada.");
  if (reserva.diaSemana === diaSemana && reserva.horaInicio === horaInicio && reserva.salaId === salaId) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um horário ou uma sala diferente da atual.");
  }

  const unidade = await carregarUnidadeParaAgendar(tx, reserva.unidadeId, reserva.equipeId, agora);
  const sala = await validarSalaNoHorario(tx, { unidadeId: reserva.unidadeId, salaId, diaSemana, horaInicio }, unidade);
  const dataInicio = novaDataDeInicio(reserva, unidade.periodos[0], diaSemana, agora);

  await tx.agendamento.update({
    where: { id: reserva.id },
    data: {
      diaSemana,
      horaInicio,
      salaId,
      estagiarioAtivoChave: chaveEstagiario(usuario.id, diaSemana, horaInicio),
      salaAtivaChave: chaveSala(salaId, diaSemana, horaInicio),
      dataInicio,
      eventos: {
        create: {
          tipo: "REMARCADO",
          usuarioId: usuario.id,
          observacao: `${descreverHorario(reserva.diaSemana, reserva.horaInicio)} → ${descreverHorario(diaSemana, horaInicio)} (${sala}), todas as semanas`,
        },
      },
    },
  });

  return { diaSemana, horaInicio, sala };
}

function novaDataDeInicio(
  reserva: { dataInicio: Date; dataFim: Date },
  periodo: { inicio: Date } | undefined,
  diaSemana: number,
  agora: Date,
): Date {
  const hoje = hojeNoBrasil(agora);
  if (reserva.dataInicio <= hoje) return reserva.dataInicio;

  const aPartirDe = periodo && periodo.inicio > hoje ? periodo.inicio : hoje;
  const dataInicio = primeiraDataNoDia(diaSemana, aPartirDe);
  if (dataInicio > reserva.dataFim) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há mais datas neste período letivo.");
  return dataInicio;
}
