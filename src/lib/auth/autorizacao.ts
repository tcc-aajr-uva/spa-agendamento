import "server-only";

import { redirect } from "next/navigation";

import type { Perfil } from "@/generated/prisma/client";
import { obterUsuarioAtual, type ContextoAutorizacao } from "@/lib/auth/sessao";

export const ROTA_ENTRAR = "/entrar";
export const ROTA_INICIO = "/inicio";

export type Escopo = {
  unidadeId: string;
  equipeId?: string;
  estagiarioId?: string;
};

export async function exigirUsuario(perfis?: Perfil[]): Promise<ContextoAutorizacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect(ROTA_ENTRAR);
  if (perfis && !perfis.includes(usuario.perfil)) redirect(ROTA_INICIO);
  return usuario;
}

export function podeAcessar(usuario: ContextoAutorizacao, escopo: Escopo): boolean {
  if (!usuario.unidades.includes(escopo.unidadeId)) return false;

  if (usuario.perfil === "COORDENACAO" || usuario.perfil === "SECRETARIA") {
    return true;
  }

  if (escopo.equipeId === undefined || !usuario.equipes.includes(escopo.equipeId)) {
    return false;
  }

  if (usuario.perfil === "ESTAGIARIO" && escopo.estagiarioId !== undefined) {
    return usuario.id === escopo.estagiarioId;
  }

  return true;
}

export function filtroDeUnidades(usuario: ContextoAutorizacao): { unidadeId: { in: string[] } } {
  return { unidadeId: { in: usuario.unidades } };
}

export function filtroDeIdsDasUnidades(usuario: ContextoAutorizacao): { id: { in: string[] } } {
  return { id: { in: usuario.unidades } };
}

export function filtroDeEscopo(usuario: ContextoAutorizacao): {
  unidadeId: { in: string[] };
  equipeId?: { in: string[] };
} {
  const unidadeId = { in: usuario.unidades };

  if (usuario.perfil === "SUPERVISOR" || usuario.perfil === "ESTAGIARIO") {
    return {
      unidadeId,
      equipeId: { in: usuario.equipes },
    };
  }

  return { unidadeId };
}
