"use server";

import { salvarPreferencias } from "@/lib/agenda/horarios";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { executarAcao, type EstadoAcao } from "../acao";
import { perfisDaRota } from "../menu";

export async function salvarMinhasPreferencias(_estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  return executarAcao(async () => {
    const total = await salvarPreferencias(usuario, formData.getAll("preferencias").map(String));
    return total === 0 ? "Preferências removidas." : "Preferências salvas.";
  });
}
