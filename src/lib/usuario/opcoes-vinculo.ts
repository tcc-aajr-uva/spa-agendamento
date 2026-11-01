import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import type { PerfilCriavel } from "@/lib/usuario/hierarquia";

export type OpcaoVinculo = {
  id: string;
  nome: string;
  disponivel: boolean;
};

export async function listarOpcoesDeVinculo(
  autor: ContextoAutorizacao,
  perfil: PerfilCriavel,
  usuarioIdAtual?: string,
): Promise<OpcaoVinculo[]> {
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    const unidades = await prisma.unidade.findMany({
      where: {
        ativa: true,
        ...(autor.perfil !== "ADMINISTRADOR" ? { id: { in: autor.unidades } } : {}),
      },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    return unidades.map((unidade) => ({ ...unidade, disponivel: true }));
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
    select: { id: true, nome: true, supervisorId: true, unidade: { select: { nome: true } } },
  });

  return equipes.map((equipe) => {
    const semSupervisor = perfil === "ESTAGIARIO" && equipe.supervisorId === null;
    return {
      id: equipe.id,
      nome: `${equipe.unidade.nome} — ${equipe.nome}${semSupervisor ? " — Sem supervisor" : ""}`,
      disponivel: !semSupervisor,
    };
  });
}
