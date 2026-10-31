import "server-only";
import { liberarAgendamento } from "@/lib/agendamento/liberar-agendamento";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";

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
