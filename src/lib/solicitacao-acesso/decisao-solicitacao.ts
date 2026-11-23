import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";
import { solicitacaoIdSchema } from "@/lib/solicitacao-acesso/dados-solicitacao";

export function validarIdDaSolicitacao(id: string): void {
  if (!solicitacaoIdSchema.safeParse(id).success) {
    throw new ErroDeRegra("NAO_ENCONTRADO", "Solicitação não encontrada.");
  }
}

export async function exigirSolicitacaoPendente(tx: Transacao, id: string, autor: ContextoAutorizacao) {
  const solicitacao = await tx.solicitacaoAcesso.findFirst({
    where: { id, ...filtroDeUnidades(autor) },
    select: { nome: true, email: true, status: true },
  });
  if (!solicitacao) throw new ErroDeRegra("NAO_ENCONTRADO", "Solicitação não encontrada.");
  if (solicitacao.status !== "PENDENTE") {
    throw new ErroDeRegra("STATUS_INVALIDO", "Esta solicitação já foi analisada.");
  }
  return { nome: solicitacao.nome, email: solicitacao.email };
}

type Decisao =
  | { status: "APROVADA"; usuarioId: string; unidadeId: string }
  | { status: "RECUSADA"; motivoRecusa: string | null };

export async function registrarDecisao(
  tx: Transacao,
  id: string,
  decisao: Decisao,
  autor: ContextoAutorizacao,
  agora: Date,
): Promise<void> {
  const data: Prisma.SolicitacaoAcessoUncheckedUpdateManyInput = {
    ...decisao,
    emailPendente: null,
    decididoPorId: autor.id,
    decididoEm: agora,
  };
  const resultado = await tx.solicitacaoAcesso.updateMany({ where: { id, status: "PENDENTE" }, data });
  if (resultado.count !== 1) {
    throw new ErroDeRegra("STATUS_INVALIDO", "Esta solicitação já foi analisada.");
  }
}
