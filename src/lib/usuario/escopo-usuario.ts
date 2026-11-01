import "server-only";

import type { Perfil, Prisma } from "@/generated/prisma/client";
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
