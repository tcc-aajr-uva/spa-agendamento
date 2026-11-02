"use server";

import { confirmarAgendamento } from "@/lib/atendimento/confirmar";
import { encerrarAtendimento } from "@/lib/atendimento/encerrar";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { executarAcao, texto, type EstadoAcao } from "../../acao";
import { perfisDaRota } from "../../menu";

export async function confirmar(agendamentoId: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  return executarAcao(async () => {
    await confirmarAgendamento(agendamentoId, usuario);
    return "Agendamento confirmado.";
  });
}

export async function encerrar(agendamentoId: string, _estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  return executarAcao(async () => {
    await encerrarAtendimento(agendamentoId, { motivo: texto(formData, "motivo"), observacao: texto(formData, "observacao") }, usuario);
    return "Atendimento encerrado e horário liberado.";
  });
}
