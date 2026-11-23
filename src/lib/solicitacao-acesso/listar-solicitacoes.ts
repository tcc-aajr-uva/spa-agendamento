import "server-only";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { situacaoSolicitacaoSchema, STATUS_DA_SITUACAO } from "@/lib/solicitacao-acesso/situacao-listagem";

const ITENS_POR_PAGINA = 10;

const filtrosSchema = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  busca: z.string().trim().max(120).catch(""),
  status: situacaoSolicitacaoSchema,
});

export type FiltrosSolicitacoes = z.input<typeof filtrosSchema>;

export async function listarSolicitacoes(entrada: FiltrosSolicitacoes, autor: ContextoAutorizacao) {
  const filtros = filtrosSchema.parse(entrada);
  const status = STATUS_DA_SITUACAO[filtros.status];
  const where: Prisma.SolicitacaoAcessoWhereInput = {
    ...filtroDeUnidades(autor),
    ...(status ? { status } : {}),
    ...(filtros.busca
      ? {
          OR: [
            { nome: { contains: filtros.busca, mode: "insensitive" } },
            { email: { contains: filtros.busca, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const ordem = status === "PENDENTE" ? "asc" : "desc";

  const [total, solicitacoes] = await Promise.all([
    prisma.solicitacaoAcesso.count({ where }),
    prisma.solicitacaoAcesso.findMany({
      where,
      orderBy: [{ criadoEm: ordem }, { id: ordem }],
      skip: (filtros.pagina - 1) * ITENS_POR_PAGINA,
      take: ITENS_POR_PAGINA,
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        motivoRecusa: true,
        criadoEm: true,
        decididoEm: true,
        unidade: { select: { nome: true } },
        decididoPor: { select: { nome: true } },
      },
    }),
  ]);

  return {
    ...filtros,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)),
    solicitacoes: solicitacoes.map((solicitacao) => ({
      id: solicitacao.id,
      nome: solicitacao.nome,
      email: solicitacao.email,
      status: solicitacao.status,
      motivoRecusa: solicitacao.motivoRecusa,
      criadoEm: solicitacao.criadoEm,
      decididoEm: solicitacao.decididoEm,
      unidade: solicitacao.unidade.nome,
      decididoPor: solicitacao.decididoPor?.nome ?? null,
    })),
  };
}
