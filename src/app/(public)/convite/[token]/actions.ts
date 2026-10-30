"use server";

import { ErroDeRegra } from "@/lib/erros";
import { aceitarConvite as definirSenhaDoConvite } from "@/lib/usuario/aceitar-convite";

export type EstadoAceiteConvite = {
  erro?: string;
  sucesso?: boolean;
};

export async function aceitarConvite(
  token: string,
  _estado: EstadoAceiteConvite,
  formData: FormData,
): Promise<EstadoAceiteConvite> {
  try {
    await definirSenhaDoConvite({
      token,
      senha: String(formData.get("senha") ?? ""),
      confirmacaoSenha: String(formData.get("confirmacaoSenha") ?? ""),
    });
    return { sucesso: true };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}
