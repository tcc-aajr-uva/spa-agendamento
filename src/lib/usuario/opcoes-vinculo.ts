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
      ...(autor.perfil !== "ADMINISTRADOR" ? { id: { in: autor.unidades } } : {}),
      OR: [
        { ativa: true },
        ...(usuarioIdAtual ? [{ usuarios: { some: { usuarioId: usuarioIdAtual, ativo: true } } }] : []),
      ],
    },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, ativa: true },
  });
  const opcoesUnidades = unidades.map((unidade) => ({
    id: unidade.id, unidadeId: unidade.id,
    nome: `${unidade.nome}${unidade.ativa ? "" : " — Inativa"}`, disponivel: unidade.ativa,
  }));
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    return { unidades: opcoesUnidades, equipes: [] };
  }

  const whereDeEscopo: Prisma.EquipeWhereInput =
    autor.perfil === "ADMINISTRADOR"
      ? {}
      : autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA"
        ? { unidadeId: { in: autor.unidades } }
        : { id: { in: autor.equipes }, supervisorId: autor.id };

  const filtroDisponiveis: Prisma.EquipeWhereInput = {
    ativa: true, unidade: { ativa: true },
    ...(perfil === "SUPERVISOR"
      ? { OR: [{ supervisorId: null }, ...(usuarioIdAtual ? [{ supervisorId: usuarioIdAtual }] : [])] }
      : {}),
    ...(perfil === "ESTAGIARIO" && (autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO")
      ? { supervisorId: { not: null } }
      : {}),
  };
  const equipes = await prisma.equipe.findMany({
    where: { AND: [whereDeEscopo, { OR: [
      filtroDisponiveis,
      ...(usuarioIdAtual ? [{ membros: { some: {
        usuarioId: usuarioIdAtual, ativo: true, vinculoUnidade: { ativo: true },
      } } }] : []),
    ] }] },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, ativa: true, supervisorId: true, unidadeId: true, unidade: { select: { nome: true, ativa: true } } },
  });

  const opcoesEquipes = equipes.map((equipe) => {
    const semSupervisor = perfil === "ESTAGIARIO" && equipe.supervisorId === null;
    return {
      id: equipe.id,
      unidadeId: equipe.unidadeId,
      nome: `${equipe.unidade.nome} — ${equipe.nome}${!equipe.unidade.ativa ? " — Unidade inativa" : !equipe.ativa ? " — Equipe inativa" : semSupervisor ? " — Sem supervisor" : ""}`,
      disponivel: equipe.ativa && equipe.unidade.ativa && !semSupervisor,
    };
  });
  return { unidades: opcoesUnidades, equipes: opcoesEquipes };
}
