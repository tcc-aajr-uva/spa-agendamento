import "server-only";

import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";

export async function listarEsperaPorEquipe(usuario: ContextoAutorizacao) {
  const equipes = await prisma.equipe.findMany({
    where: {
      ...filtroDeUnidades(usuario),
      OR: [{ ativa: true }, { listaEspera: { some: { status: "AGUARDANDO" } } }],
    },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      unidade: { select: { nome: true } },
      _count: { select: { listaEspera: { where: { status: "AGUARDANDO" } } } },
    },
  });

  return equipes.map((equipe) => ({
    id: equipe.id,
    unidade: equipe.unidade.nome,
    equipe: equipe.nome,
    total: equipe._count.listaEspera,
  }));
}