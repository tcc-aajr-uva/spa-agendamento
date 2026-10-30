import { refresh } from "next/cache";
import { headers } from "next/headers";
import { ErroDeRegra } from "@/lib/erros";

export type EstadoAcao = {
  erro?: string;
  mensagem?: string;
  avisarAoSair?: boolean;
};

export async function executarAcao(operacao: () => Promise<string | EstadoAcao>): Promise<EstadoAcao> {
  try {
    const resultado = await operacao();
    refresh();
    return typeof resultado === "string" ? { mensagem: resultado } : resultado;
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

export function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function montarLinkDeCancelamento(token: string): Promise<string> {
  const origem = (await headers()).get("origin") ?? "";
  return `${origem}/cancelar?token=${token}`;
}
