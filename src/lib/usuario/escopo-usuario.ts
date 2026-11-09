import "server-only";

import { Prisma, type Perfil } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";

export function filtroDeUsuariosGerenciaveis(autor: ContextoAutorizacao): Prisma.UsuarioWhereInput {
  const perfisGerenciados = perfisCriadosPor(autor.perfil);
  if (perfisGerenciados.length === 0) return { id: { in: [] } };

  const perfil = { in: [...perfisGerenciados] as Perfil[] };
  if (autor.perfil === "ADMINISTRADOR") return { perfil };

  if (autor.perfil === "SUPERVISOR") {
    return {
      perfil,
      equipes: {
        some: {
          ativo: true,
          vinculoUnidade: { ativo: true },
          equipeId: { in: autor.equipes },
          equipe: { ativa: true, supervisorId: autor.id },
        },
      },
    };
  }

  return {
    perfil,
    unidades: {
      some: {
        ativo: true,
        unidadeId: { in: autor.unidades },
        unidade: { ativa: true },
      },
    },
  };
}

export function filtroDeUsuariosVisiveis(autor: ContextoAutorizacao): Prisma.UsuarioWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};
  return filtroDeUsuariosGerenciaveis(autor);
}

export function filtroSqlDeUsuariosVisiveis(autor: ContextoAutorizacao): Prisma.Sql {
  if (autor.perfil === "ADMINISTRADOR") return Prisma.sql`TRUE`;
  const perfis = perfisCriadosPor(autor.perfil);
  if (perfis.length === 0) return Prisma.sql`FALSE`;

  const perfil = Prisma.sql`u.perfil::text IN (${Prisma.join([...perfis])})`;
  if (autor.perfil === "SUPERVISOR") {
    return Prisma.sql`${perfil} AND EXISTS (
      SELECT 1 FROM "UsuarioEquipe" ue
      JOIN "UsuarioUnidade" uu ON uu."usuarioId" = ue."usuarioId" AND uu."unidadeId" = ue."unidadeId"
      JOIN "Equipe" e ON e.id = ue."equipeId"
      WHERE ue."usuarioId" = u.id AND ue.ativo AND uu.ativo
        AND ue."equipeId" = ANY(${autor.equipes}::text[])
        AND e.ativa AND e."supervisorId" = ${autor.id}
    )`;
  }

  return Prisma.sql`${perfil} AND EXISTS (
    SELECT 1 FROM "UsuarioUnidade" uu
    JOIN "Unidade" unidade ON unidade.id = uu."unidadeId"
    WHERE uu."usuarioId" = u.id AND uu.ativo AND unidade.ativa
      AND uu."unidadeId" = ANY(${autor.unidades}::text[])
  )`;
}

export function filtroDeVinculosDeUnidadeGerenciaveis(
  autor: ContextoAutorizacao,
): Prisma.UsuarioUnidadeWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};
  return { unidadeId: { in: autor.unidades } };
}

export function filtroDeVinculosDeEquipeGerenciaveis(
  autor: ContextoAutorizacao,
): Prisma.UsuarioEquipeWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};
  if (autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA") {
    return { unidadeId: { in: autor.unidades } };
  }
  if (autor.perfil === "SUPERVISOR") {
    return {
      equipeId: { in: autor.equipes },
      equipe: { supervisorId: autor.id },
    };
  }
  return { equipeId: { in: [] } };
}

export function podeGerenciarVinculoDeUnidade(
  autor: ContextoAutorizacao,
  unidadeId: string,
): boolean {
  return autor.perfil === "ADMINISTRADOR" || autor.unidades.includes(unidadeId);
}

export function podeGerenciarVinculoDeEquipe(
  autor: ContextoAutorizacao,
  vinculo: { equipeId: string; unidadeId: string; supervisorId: string | null },
): boolean {
  if (autor.perfil === "ADMINISTRADOR") return true;
  if (autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA") {
    return autor.unidades.includes(vinculo.unidadeId);
  }
  return (
    autor.perfil === "SUPERVISOR" &&
    autor.equipes.includes(vinculo.equipeId) &&
    vinculo.supervisorId === autor.id
  );
}

export function podeAlterarAcessoDoUsuario(
  autor: ContextoAutorizacao,
  unidadesDoUsuario: readonly string[],
): boolean {
  if (autor.perfil === "ADMINISTRADOR") return true;
  if (autor.perfil !== "COORDENACAO") return false;
  return unidadesDoUsuario.every((unidadeId) => autor.unidades.includes(unidadeId));
}
