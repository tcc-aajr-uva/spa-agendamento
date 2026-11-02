import "server-only";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroDeEquipesVisiveis, podeGerenciarEquipes } from "./escopo-equipe";

const filtrosSchema = z.object({
  busca: z.string().trim().max(120).catch(""),
  unidadeId: z.union([z.cuid2(), z.literal("")]).catch(""),
  status: z.enum(["ATIVAS", "INATIVAS", "TODAS"]).catch("ATIVAS"),
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
});

export async function listarEquipes(entrada: z.input<typeof filtrosSchema>, autor: ContextoAutorizacao) {
  const filtros = filtrosSchema.parse(entrada);
  const podeGerenciar = podeGerenciarEquipes(autor);
  const status = podeGerenciar ? filtros.status : "ATIVAS";
  const where: Prisma.EquipeWhereInput = {
    AND: [filtroDeEquipesVisiveis(autor)],
    ...(filtros.busca ? { nome: { contains: filtros.busca, mode: "insensitive" } } : {}),
    ...(filtros.unidadeId ? { unidadeId: filtros.unidadeId } : {}),
    ...(status !== "TODAS" ? { ativa: status === "ATIVAS" } : {}),
  };
  const total = await prisma.equipe.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / 20));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const equipes = await prisma.equipe.findMany({
    where,
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }, { id: "asc" }],
    skip: (pagina - 1) * 20,
    take: 20,
    select: {
      id: true, nome: true, ativa: true,
      unidade: { select: { nome: true, ativa: true } },
      supervisor: { select: { nome: true, ativo: true } },
    },
  });
  return { ...filtros, status, pagina, total, totalPaginas, equipes, podeGerenciar };
}
