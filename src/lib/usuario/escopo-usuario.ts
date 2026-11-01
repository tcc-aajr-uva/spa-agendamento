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
