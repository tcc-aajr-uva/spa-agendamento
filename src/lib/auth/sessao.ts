import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import type { Perfil } from "@/generated/prisma/client";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export type ContextoAutorizacao = {
  id: string;
  nome: string;
  perfil: Perfil;
  unidades: string[];
  equipes: string[];
};

export const obterSessao = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  }),
);

export const obterUsuarioAtual = cache(async (): Promise<ContextoAutorizacao | null> => {
  const sessao = await obterSessao();
  if (!sessao) return null;

  const usuario = await prisma.usuario.findFirst({
    where: {
      id: sessao.user.id,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      perfil: true,
      unidades: {
        where: {
          ativo: true,
          unidade: { ativa: true },
        },
        select: { unidadeId: true },
      },
      equipes: {
        where: {
          ativo: true,
          vinculoUnidade: { ativo: true },
          equipe: { ativa: true },
        },
        select: { equipeId: true },
      },
    },
  });

  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil,
    unidades: usuario.unidades.map(({ unidadeId }) => unidadeId),
    equipes: usuario.equipes.map(({ equipeId }) => equipeId),
  };
});
