"use server";

import { ErroDeRegra } from "@/lib/erros";
import { consumirLimiteDoCliente } from "@/lib/limite-requisicao";
import { novaSolicitacaoSchema } from "@/lib/solicitacao-acesso/dados-solicitacao";
import { registrarSolicitacao } from "@/lib/solicitacao-acesso/registrar-solicitacao";
import type { EstadoSolicitacaoAcesso } from "./estado-solicitacao";

const JANELA_LIMITE_MS = 10 * 60_000;
const MAXIMO_SOLICITACOES_NA_JANELA = 5;

export async function solicitarAcesso(
  _estado: EstadoSolicitacaoAcesso,
  formData: FormData,
): Promise<EstadoSolicitacaoAcesso> {
  try {
    await consumirLimiteDoCliente({
      escopo: "solicitacao-acesso",
      janelaMs: JANELA_LIMITE_MS,
      maximo: MAXIMO_SOLICITACOES_NA_JANELA,
    });

    const entrada = novaSolicitacaoSchema.safeParse({
      nome: formData.get("nome"),
      email: formData.get("email"),
      unidadeId: formData.get("unidadeId"),
    });
    if (!entrada.success) return { status: "erro", mensagem: entrada.error.issues[0].message };

    await registrarSolicitacao(entrada.data);
    return { status: "sucesso" };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
    throw erro;
  }
}
