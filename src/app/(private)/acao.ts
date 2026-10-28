import { refresh } from "next/cache";
import { ErroDeRegra } from "@/lib/erros";

export type EstadoAcao = {
  erro?: string;
  mensagem?: string;
};

export async function executarAcao(operacao: () => Promise<string>): Promise<EstadoAcao> {
  try {
    const mensagem = await operacao();
    refresh();
    return { mensagem };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

export function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}
