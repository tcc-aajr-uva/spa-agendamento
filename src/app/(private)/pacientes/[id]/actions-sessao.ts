"use server";

import { registrarSessao, type ResultadoSessao } from "@/lib/atendimento/registrar-sessao";
import { exigirUsuario } from "@/lib/auth/permissao";
import { executarAcao, texto, type EstadoAcao } from "../../acao";
import { perfisDaRota } from "../../menu";

const MENSAGENS: Record<ResultadoSessao, string> = {
  REGISTRADA: "Sessão registrada.",
  CANCELADO_FALTA_PRIMEIRA_SESSAO: "Falta na 1ª sessão sem aviso: agendamento cancelado e horário liberado.",
  ENCERRADO_TRES_FALTAS: "Terceira falta seguida: caso encerrado e horário liberado.",
};

export async function registrar(agendamentoId: string, _estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  return executarAcao(async () => {
    const resultado = await registrarSessao(
      agendamentoId,
      { data: texto(formData, "data"), presenca: texto(formData, "presenca"), termoAssinado: formData.get("termoAssinado") === "on" },
      usuario,
    );
    return MENSAGENS[resultado];
  });
}
