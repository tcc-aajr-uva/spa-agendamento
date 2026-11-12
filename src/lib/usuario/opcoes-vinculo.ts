import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import type { PerfilCriavel } from "@/lib/usuario/hierarquia";

export type OpcaoVinculo = {
  id: string;
  unidadeId: string;
  nome: string;
  disponivel: boolean;
};

export async function listarOpcoesDeVinculo(
  autor: ContextoAutorizacao,
  perfil: PerfilCriavel,
  usuarioIdAtual?: string,
): Promise<{ unidades: OpcaoVinculo[]; equipes: OpcaoVinculo[] }> {
  const unidades = await prisma.unidade.findMany({
    where: {
      ativa: true,
      ...(autor.perfil !== "ADMINISTRADOR" ? { id: { in: autor.unidades } } : {}),
    },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
  const opcoesUnidades = unidades.map((unidade) => ({ ...unidade, unidadeId: unidade.id, disponivel: true }));
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    return { unidades: opcoesUnidades, equipes: [] };
  }

  const whereDeEscopo: Prisma.EquipeWhereInput =
    autor.perfil === "ADMINISTRADOR"
      ? {}
      : autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA"
        ? { unidadeId: { in: autor.unidades } }
        : { id: { in: autor.equipes }, supervisorId: autor.id };

  const equipes = await prisma.equipe.findMany({
    where: {
      ativa: true,
      unidade: { ativa: true },
      ...whereDeEscopo,
      ...(perfil === "SUPERVISOR"
        ? { OR: [{ supervisorId: null }, ...(usuarioIdAtual ? [{ supervisorId: usuarioIdAtual }] : [])] }
        : {}),
      ...(perfil === "ESTAGIARIO" && (autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO")
        ? {
            OR: [
              { supervisorId: { not: null } },
              ...(usuarioIdAtual
                ? [{ membros: { some: { usuarioId: usuarioIdAtual, ativo: true } } }]
                : []),
            ],
          }
        : {}),
    },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, supervisorId: true, unidadeId: true, unidade: { select: { nome: true } } },
  });

  const opcoesEquipes = equipes.map((equipe) => {
    const semSupervisor = perfil === "ESTAGIARIO" && equipe.supervisorId === null;
    return {
      id: equipe.id,
      unidadeId: equipe.unidadeId,
      nome: `${equipe.unidade.nome} — ${equipe.nome}${semSupervisor ? " — Sem supervisor" : ""}`,
      disponivel: !semSupervisor,
    };
  });
  return { unidades: opcoesUnidades, equipes: opcoesEquipes };
}
