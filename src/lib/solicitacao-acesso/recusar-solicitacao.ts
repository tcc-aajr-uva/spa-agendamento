import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";
import { recusaSolicitacaoSchema, type RecusaSolicitacao } from "@/lib/solicitacao-acesso/dados-solicitacao";
import {
  exigirSolicitacaoPendente,
  registrarDecisao,
  validarIdDaSolicitacao,
} from "@/lib/solicitacao-acesso/decisao-solicitacao";

export async function recusarSolicitacao(
  id: string,
  entrada: RecusaSolicitacao,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<void> {
  validarIdDaSolicitacao(id);
  const resultado = recusaSolicitacaoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  await executarEmTransacao(async (tx) => {
    await exigirSolicitacaoPendente(tx, id, autor);
    await registrarDecisao(tx, id, {
      status: "RECUSADA",
      motivoRecusa: resultado.data.motivo || null,
    }, autor, agora);
  });
}
