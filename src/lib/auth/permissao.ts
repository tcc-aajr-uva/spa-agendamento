import "server-only";
import { redirect } from "next/navigation";
import type { Perfil } from "@/generated/prisma/client";
import { obterUsuarioAtual, type UsuarioAtual } from "@/lib/auth/usuario-atual";

export const ROTA_ENTRAR = "/dev/entrar";
export const ROTA_INICIO = "/inicio";

export type Escopo = {
  unidadeId: string;
  equipeId?: string;
  estagiarioId?: string;
};

export async function exigirUsuario(perfis?: Perfil[]): Promise<UsuarioAtual> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect(ROTA_ENTRAR);
  if (perfis && !perfis.includes(usuario.perfil)) redirect(ROTA_INICIO);
  return usuario;
}

export function podeAcessar(usuario: UsuarioAtual, escopo: Escopo): boolean {
  switch (usuario.perfil) {
    case "COORDENACAO":
      return usuario.unidadeId === null || usuario.unidadeId === escopo.unidadeId;
    case "SECRETARIA":
      return usuario.unidadeId === escopo.unidadeId;
    case "SUPERVISOR":
      return usuario.unidadeId === escopo.unidadeId && escopo.equipeId !== undefined && usuario.equipeId === escopo.equipeId;
    case "ESTAGIARIO":
      if (escopo.estagiarioId !== undefined) return usuario.id === escopo.estagiarioId;
      return usuario.unidadeId === escopo.unidadeId && escopo.equipeId !== undefined && usuario.equipeId === escopo.equipeId;
  }
}

export function filtroDeUnidade(usuario: UsuarioAtual): { unidadeId?: string } {
  if (usuario.perfil === "COORDENACAO" && usuario.unidadeId === null) return {};
  return { unidadeId: usuario.unidadeId ?? "" };
}
