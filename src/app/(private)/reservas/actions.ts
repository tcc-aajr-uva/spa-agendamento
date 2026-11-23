"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { descreverHorario } from "@/lib/agenda/horarios";
import { cancelarReservaDoEstagiario, remarcarReservaDoEstagiario } from "@/lib/agenda/reservas";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { perfisDaRota } from "../menu";

export type EstadoReserva = { erro?: string; mensagem?: string };

const agendamentoIdSchema = z.string().min(1, "Reserva não encontrada.");

export async function cancelarReserva(_estado: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  const agendamentoId = agendamentoIdSchema.safeParse(String(formData.get("agendamentoId") ?? ""));
  if (!agendamentoId.success) return { erro: agendamentoId.error.issues[0].message };
  try {
    await cancelarReservaDoEstagiario(usuario, agendamentoId.data);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  refresh();
  return {};
}

export async function remarcarReserva(_estado: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  const agendamentoId = agendamentoIdSchema.safeParse(String(formData.get("agendamentoId") ?? ""));
  if (!agendamentoId.success) return { erro: agendamentoId.error.issues[0].message };

  try {
    const novo = await remarcarReservaDoEstagiario(usuario, agendamentoId.data, {
      diaSemana: String(formData.get("diaSemana") ?? ""),
      horaInicio: String(formData.get("horaInicio") ?? ""),
      salaId: String(formData.get("salaId") ?? ""),
    });
    refresh();
    return { mensagem: `Remarcado para ${descreverHorario(novo.diaSemana, novo.horaInicio)}, ${novo.sala}.` };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}
