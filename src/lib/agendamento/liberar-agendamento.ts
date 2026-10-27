import "server-only";
import type { MotivoEncerramento, Prisma } from "@/generated/prisma/client";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";

export type Liberacao = {
  status: "CANCELADO" | "ENCERRADO";
  motivo: MotivoEncerramento;
  usuarioId?: string | null;
  observacao?: string;
};

const CHAVES_LIBERADAS = { horarioAtivoId: null, salaAtivaChave: null, pacienteAtivoId: null } as const;

export async function liberarAgendamento(agendamentoId: string, liberacao: Liberacao, tx?: Transacao): Promise<void> {
  if (!tx) return executarEmTransacao((novaTx) => liberarAgendamento(agendamentoId, liberacao, novaTx));

  const agendamento = await tx.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { horarioAtivoId: true },
  });
  if (!agendamento) throw new ErroDeRegra("NAO_ENCONTRADO", "Agendamento não encontrado.");
  if (agendamento.horarioAtivoId === null) return;

  await tx.agendamento.update({
    where: { id: agendamentoId },
    data: {
      ...CHAVES_LIBERADAS,
      status: liberacao.status,
      motivoEncerramento: liberacao.motivo,
      encerradoEm: new Date(),
      eventos: {
        create: {
          tipo: liberacao.status === "CANCELADO" ? "CANCELADO" : "ENCERRADO",
          usuarioId: liberacao.usuarioId ?? null,
          observacao: liberacao.observacao ?? liberacao.motivo,
        },
      },
    },
  });
}

export async function liberarPendentesVencidos(tx: Transacao, filtro: Prisma.AgendamentoWhereInput, agora: Date): Promise<number> {
  const vencidos = await tx.agendamento.findMany({
    where: { ...filtro, status: "PENDENTE", prazoConfirmacao: { lte: agora }, horarioAtivoId: { not: null } },
    select: { id: true },
  });
  if (vencidos.length === 0) return 0;

  const ids = vencidos.map((vencido) => vencido.id);
  await tx.agendamento.updateMany({
    where: { id: { in: ids } },
    data: { ...CHAVES_LIBERADAS, status: "CANCELADO", motivoEncerramento: "NAO_CONFIRMADO", encerradoEm: agora },
  });
  await tx.eventoAgendamento.createMany({
    data: ids.map((agendamentoId) => ({ agendamentoId, tipo: "CANCELADO" as const, observacao: "NAO_CONFIRMADO" })),
  });
  return ids.length;
}
