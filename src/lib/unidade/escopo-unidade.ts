import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";

export const PERFIS_UNIDADES = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA"] as const;

export function filtroDeUnidadesGerenciaveis(autor: ContextoAutorizacao): Prisma.UnidadeWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};
  if (autor.perfil !== "COORDENACAO" && autor.perfil !== "SECRETARIA") return { id: { in: [] } };
  return { id: { in: autor.unidades }, ativa: true };
}

export function podeCriarUnidade(autor: ContextoAutorizacao): boolean {
  return autor.perfil === "ADMINISTRADOR";
}

export function podeAlterarAtivacaoDeUnidade(autor: ContextoAutorizacao): boolean {
  return autor.perfil === "ADMINISTRADOR";
}
