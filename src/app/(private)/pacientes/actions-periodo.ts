"use server";

import { encerrarPeriodo } from "@/lib/atendimento/encerrar-periodo";
import { exigirUsuario } from "@/lib/auth/permissao";
import { executarAcao, type EstadoAcao } from "../acao";
import { perfisDaRota } from "../menu";

export async function encerrar(unidadeId: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  return executarAcao(async () => {
    const quantidade = await encerrarPeriodo(unidadeId, usuario);
    return `${quantidade} atendimento(s) encerrado(s) por fim do período.`;
  });
}
