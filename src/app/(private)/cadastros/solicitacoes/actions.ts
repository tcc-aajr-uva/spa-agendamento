"use server";

import { revalidatePath } from "next/cache";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { aprovarSolicitacao as aprovar } from "@/lib/solicitacao-acesso/aprovar-solicitacao";
import { aprovacaoSolicitacaoSchema, recusaSolicitacaoSchema } from "@/lib/solicitacao-acesso/dados-solicitacao";
import { recusarSolicitacao as recusar } from "@/lib/solicitacao-acesso/recusar-solicitacao";
import { urlDoConvite } from "@/lib/usuario/url-convite";
import { perfisDaRota } from "../../menu";
import type { EstadoAprovacaoSolicitacao, EstadoRecusaSolicitacao } from "./estado-solicitacao";

export async function aprovarSolicitacao(
  id: string,
  _estado: EstadoAprovacaoSolicitacao,
  formData: FormData,
): Promise<EstadoAprovacaoSolicitacao> {
  const autor = await exigirUsuario(perfisDaRota("/cadastros/solicitacoes"));
  const entrada = aprovacaoSolicitacaoSchema.safeParse({
    unidadeIds: formData.getAll("unidadeIds").map(String),
    equipeIds: formData.getAll("equipeIds").map(String),
  });
  if (!entrada.success) return { status: "erro", mensagem: entrada.error.issues[0].message };

  try {
    const resultado = await aprovar(id, entrada.data, autor);
    revalidarTelas();
    return {
      status: "sucesso",
      linkConvite: urlDoConvite(resultado.linkConvite),
      expiraEm: resultado.expiraEm.toISOString(),
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
    throw erro;
  }
}

export async function recusarSolicitacao(
  id: string,
  _estado: EstadoRecusaSolicitacao,
  formData: FormData,
): Promise<EstadoRecusaSolicitacao> {
  const autor = await exigirUsuario(perfisDaRota("/cadastros/solicitacoes"));
  const entrada = recusaSolicitacaoSchema.safeParse({ motivo: formData.get("motivo") ?? "" });
  if (!entrada.success) return { status: "erro", mensagem: entrada.error.issues[0].message };

  try {
    await recusar(id, entrada.data, autor);
    revalidatePath("/cadastros/solicitacoes");
    return { status: "sucesso" };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
    throw erro;
  }
}

function revalidarTelas() {
  revalidatePath("/cadastros/solicitacoes");
  revalidatePath("/cadastros/usuarios");
  revalidatePath("/cadastros/equipes");
  revalidatePath("/cadastros/equipes/[id]", "page");
}
