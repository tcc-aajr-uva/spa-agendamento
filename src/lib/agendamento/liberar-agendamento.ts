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

const CHAVES_LIBERADAS = { estagiarioAtivoChave: null, salaAtivaChave: null, pacienteAtivoId: null } as const;

export async function liberarAgendamento(agendamentoId: string, liberacao: Liberacao, tx?: Transacao): Promise<void> {
  if (!tx) return executarEmTransacao((novaTx) => liberarAgendamento(agendamentoId, liberacao, novaTx));

  const agendamento = await tx.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { estagiarioAtivoChave: true },
  });
  if (!agendamento) throw new ErroDeRegra("NAO_ENCONTRADO", "Agendamento não encontrado.");
  if (agendamento.estagiarioAtivoChave === null) return;

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
  await devolverParaLista(tx, [agendamentoId], liberacao);
}

export async function liberarPendentesVencidos(tx: Transacao, filtro: Prisma.AgendamentoWhereInput, agora: Date): Promise<number> {
  const vencidos = await tx.agendamento.findMany({
    where: { ...filtro, status: "PENDENTE", prazoConfirmacao: { lte: agora }, estagiarioAtivoChave: { not: null } },
    select: { id: true },
  });
  if (vencidos.length === 0) return 0;

  await liberarEmLote(tx, vencidos.map((vencido) => vencido.id), { status: "CANCELADO", motivo: "NAO_CONFIRMADO" }, agora);
  return vencidos.length;
}

export async function liberarEmLote(tx: Transacao, ids: string[], liberacao: Liberacao, agora: Date): Promise<void> {
  await tx.agendamento.updateMany({
    where: { id: { in: ids } },
    data: { ...CHAVES_LIBERADAS, status: liberacao.status, motivoEncerramento: liberacao.motivo, encerradoEm: agora },
  });
  await tx.eventoAgendamento.createMany({
    data: ids.map((agendamentoId) => ({
      agendamentoId,
      tipo: liberacao.status,
      usuarioId: liberacao.usuarioId ?? null,
      observacao: liberacao.observacao ?? liberacao.motivo,
    })),
  });
  await devolverParaLista(tx, ids, liberacao);
}

async function devolverParaLista(tx: Transacao, ids: string[], liberacao: Liberacao): Promise<void> {
  if (liberacao.motivo !== "NAO_CONFIRMADO") return;

  const vindosDaLista = await tx.agendamento.findMany({
    where: { id: { in: ids }, listaEsperaId: { not: null } },
    select: { listaEsperaId: true, pacienteId: true },
  });
  for (const { listaEsperaId, pacienteId } of vindosDaLista) {
    if (!listaEsperaId) continue;
    await tx.listaEspera.updateMany({
      where: { id: listaEsperaId, status: "CHAMADO" },
      data: { status: "AGUARDANDO", pacienteAtivoId: pacienteId },
    });
  }
}
