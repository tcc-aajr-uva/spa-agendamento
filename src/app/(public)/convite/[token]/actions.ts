"use server";

import { headers } from "next/headers";

import { ErroDeRegra } from "@/lib/erros";
import { consumirLimiteRequisicoes } from "@/lib/limite-requisicao";
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
    await consumirLimiteRequisicoes({
      escopo: "aceite-convite",
      identificador: await identificarCliente(),
      janelaMs: 60_000,
      maximo: 10,
    });
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

async function identificarCliente(): Promise<string> {
  const cabecalhos = await headers();
  return (
    cabecalhos.get("x-vercel-forwarded-for") ??
    cabecalhos.get("x-real-ip") ??
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "endereco-indisponivel"
  );
}
