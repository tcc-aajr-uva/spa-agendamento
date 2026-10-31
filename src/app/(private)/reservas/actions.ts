"use server";

import { refresh } from "next/cache";
import { liberarAgendamento } from "@/lib/agendamento/liberar-agendamento";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";
import { perfisDaRota } from "../menu";

export type EstadoReserva = { erro?: string };

export async function cancelarReserva(_estado: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  const agendamentoId = String(formData.get("agendamentoId") ?? "");

  try {
    const erro = await executarEmTransacao(async (tx) => {
      // Filtra pelo estagiário logado: ninguém cancela a reserva de outro trocando o id no formulário.
      const reserva = await tx.agendamento.findFirst({
        where: { id: agendamentoId, estagiarioId: usuario.id, horarioAtivoId: { not: null } },
        select: { id: true },
      });
      if (!reserva) return "Reserva não encontrada ou já encerrada.";

      await liberarAgendamento(reserva.id, { status: "CANCELADO", motivo: "CANCELADO_PELO_ESTAGIARIO", usuarioId: usuario.id }, tx);
      return null;
    });
    if (erro) return { erro };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  refresh();
  return {};
}
