import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import type { Transacao } from "@/lib/transacao";
import { periodoIdSchema } from "./dados-periodo";

export const PERFIS_GESTAO_PERIODOS = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA"] as const;

export function podeGerenciarPeriodos(autor: ContextoAutorizacao): boolean {
  return autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA";
}

export function filtroDeUnidadesDosPeriodos(autor: ContextoAutorizacao): Prisma.UnidadeWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};
  if (!PERFIS_GESTAO_PERIODOS.some((perfil) => perfil === autor.perfil)) return { id: { in: [] } };
  return { id: { in: autor.unidades }, ativa: true };
}

export async function consultarUnidadeDosPeriodos(
  id: string, autor: ContextoAutorizacao, cliente: Pick<Transacao, "unidade"> = prisma,
) {
  if (!periodoIdSchema.safeParse(id).success) return null;
  return cliente.unidade.findFirst({
    where: { id, AND: [filtroDeUnidadesDosPeriodos(autor)] }, select: { id: true, nome: true, ativa: true },
  });
}
