"use server";

import { refresh } from "next/cache";
import { cancelarReservaDoEstagiario } from "@/lib/agenda/reservas";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { perfisDaRota } from "../menu";

export type EstadoReserva = { erro?: string };

export async function cancelarReserva(_estado: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  try {
    await cancelarReservaDoEstagiario(usuario, String(formData.get("agendamentoId") ?? ""));
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  refresh();
  return {};
}
