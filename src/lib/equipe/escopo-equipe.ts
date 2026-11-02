import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";

export const PERFIS_EQUIPES = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR"] as const;
export const PERFIS_GESTAO_EQUIPES = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA"] as const;

export function podeGerenciarEquipes(autor: ContextoAutorizacao): boolean {
  return autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA";
}

export function filtroDeEquipesVisiveis(autor: ContextoAutorizacao): Prisma.EquipeWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};
  const unidade = { unidadeId: { in: autor.unidades }, unidade: { ativa: true } };
  if (autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA") return unidade;
  if (autor.perfil === "SUPERVISOR") {
    return {
      ...unidade,
      id: { in: autor.equipes },
      ativa: true,
      supervisorId: autor.id,
      membros: { some: { usuarioId: autor.id, ativo: true, vinculoUnidade: { ativo: true } } },
    };
  }
  return { id: { in: [] } };
}
