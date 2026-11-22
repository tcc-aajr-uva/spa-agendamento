import "server-only";

import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { solicitacaoIdSchema } from "@/lib/solicitacao-acesso/dados-solicitacao";

export async function consultarSolicitacao(id: string, autor: ContextoAutorizacao) {
  if (!solicitacaoIdSchema.safeParse(id).success) return null;

  return prisma.solicitacaoAcesso.findFirst({
    where: { id, ...filtroDeUnidades(autor) },
    select: { id: true, nome: true, email: true, unidadeId: true, status: true },
  });
}
