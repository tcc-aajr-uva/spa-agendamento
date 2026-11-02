import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { equipeIdSchema } from "./dados-equipe";
import { filtroDeEquipesVisiveis, podeGerenciarEquipes } from "./escopo-equipe";

export async function consultarEquipe(equipeId: string, autor: ContextoAutorizacao) {
  if (!equipeIdSchema.safeParse(equipeId).success) return null;
  return prisma.equipe.findFirst({
    where: { id: equipeId, AND: [filtroDeEquipesVisiveis(autor)] },
    select: {
      id: true, nome: true, unidadeId: true, ativa: true, supervisorId: true,
      unidade: { select: { nome: true, ativa: true } },
      supervisor: { select: { nome: true, ativo: true } },
    },
  });
}

export async function listarUnidadesParaEquipe(autor: ContextoAutorizacao, somenteAtivas = true) {
  return prisma.unidade.findMany({
    where: {
      ...(somenteAtivas || autor.perfil !== "ADMINISTRADOR" ? { ativa: true } : {}),
      ...(autor.perfil !== "ADMINISTRADOR" ? { id: { in: autor.unidades } } : {}),
    },
    select: { id: true, nome: true, ativa: true },
    orderBy: [{ nome: "asc" }, { id: "asc" }],
  });
}

export async function listarSupervisoresParaEquipe(autor: ContextoAutorizacao) {
  if (!podeGerenciarEquipes(autor)) return [];
  const supervisores = await prisma.usuario.findMany({
    where: {
      perfil: "SUPERVISOR", ativo: true,
      ...(autor.perfil !== "ADMINISTRADOR" ? {
        unidades: { some: { ativo: true, unidadeId: { in: autor.unidades }, unidade: { ativa: true } } },
      } : {}),
    },
    select: {
      id: true, nome: true, email: true,
      unidades: {
        where: { ativo: true, unidade: { ativa: true }, ...(autor.perfil !== "ADMINISTRADOR" ? { unidadeId: { in: autor.unidades } } : {}) },
        select: { unidadeId: true },
      },
    },
    orderBy: [{ nome: "asc" }, { id: "asc" }],
  });
  return supervisores.map(({ unidades, ...supervisor }) => ({
    ...supervisor, unidadeIds: unidades.map(({ unidadeId }) => unidadeId), qualquerUnidade: autor.perfil === "ADMINISTRADOR",
  }));
}
