"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { salvarAtendimentoEstagiario } from "@/lib/usuario/atendimento-estagiario";

export type EstadoAtendimento = { erro?: string; sucesso?: string; confirmacao?: number };

export async function salvarAtendimento(
  estagiarioId: string, equipeId: string, periodoLetivoId: string,
  _estado: EstadoAtendimento, formData: FormData,
): Promise<EstadoAtendimento> {
  const autor = await exigirUsuario(["ADMINISTRADOR", "SUPERVISOR"]);
  const liberado = formData.get("liberado");
  const limite = formData.get("limitePacientes");
  if ((liberado !== null && liberado !== "on") || typeof limite !== "string" || !limite.trim()) {
    return { erro: "Informe uma configuração válida." };
  }
  try {
    await salvarAtendimentoEstagiario({
      estagiarioId, equipeId, periodoLetivoId,
      liberado: liberado === "on", limitePacientes: limite,
      versao: String(formData.get("versao") ?? "") || null,
    }, autor);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  revalidatePath(`/cadastros/usuarios/${estagiarioId}`);
  revalidatePath("/cadastros/unidades/[id]/periodos/[periodoId]", "page");
  revalidatePath("/agendar");
  revalidatePath("/agenda");
  revalidatePath("/lista-espera/[id]/chamar", "page");
  revalidatePath("/pacientes/[id]", "page");
  return { sucesso: "Configuração de atendimento atualizada.", confirmacao: Date.now() };
}
