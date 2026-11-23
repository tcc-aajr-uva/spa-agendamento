import "server-only";

import { prisma } from "@/lib/prisma";

export type UnidadeDisponivel = {
  id: string;
  nome: string;
};

export async function listarUnidadesDisponiveis(): Promise<UnidadeDisponivel[]> {
  return prisma.unidade.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}
