"use server";

import { transferirAgendamento } from "@/lib/atendimento/transferir";
import { exigirUsuario } from "@/lib/auth/permissao";
import { executarAcao, texto, type EstadoAcao } from "../../acao";
import { perfisDaRota } from "../../menu";

export async function transferir(agendamentoId: string, _estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  return executarAcao(async () => {
    await transferirAgendamento(agendamentoId, texto(formData, "horarioDisponivelId"), usuario);
    return "Caso transferido.";
  });
}
