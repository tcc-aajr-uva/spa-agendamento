import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Perfil } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type UsuarioAtual = {
  id: string;
  nome: string;
  perfil: Perfil;
  unidadeId: string | null;
  equipeId: string | null;
};

export const COOKIE_USUARIO_DEV = "dev_usuario";

export function sessaoDeDesenvolvimentoAtiva(): boolean {
  return process.env.NODE_ENV === "development";
}

export const obterUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const usuarioId = (await cookies()).get(COOKIE_USUARIO_DEV)?.value;
  if (!usuarioId || !sessaoDeDesenvolvimentoAtiva()) return null;

  return prisma.usuario.findFirst({
    where: { id: usuarioId, ativo: true },
    select: { id: true, nome: true, perfil: true, unidadeId: true, equipeId: true },
  });
});
