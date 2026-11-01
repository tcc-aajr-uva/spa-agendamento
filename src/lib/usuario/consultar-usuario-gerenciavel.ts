import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { perfisCriaveisSchema, usuarioIdSchema } from "@/lib/usuario/dados-usuario";
import { determinarEstadoAcesso } from "@/lib/usuario/estado-acesso";
import { filtroDeUsuariosGerenciaveis } from "@/lib/usuario/escopo-usuario";

export async function consultarUsuarioGerenciavel(usuarioId: string, autor: ContextoAutorizacao, agora = new Date()) {
  if (!usuarioIdSchema.safeParse(usuarioId).success) return null;

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, ...filtroDeUsuariosGerenciaveis(autor) },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      accounts: {
        where: { providerId: "credential" },
        take: 1,
        select: { id: true },
      },
      convites: {
        orderBy: { criadoEm: "desc" },
        take: 1,
        select: { expiraEm: true, usadoEm: true, revogadoEm: true },
      },
      unidades: {
        where: { ativo: true, unidade: { ativa: true } },
        select: { unidadeId: true },
      },
      equipes: {
        where: { ativo: true, vinculoUnidade: { ativo: true }, equipe: { ativa: true } },
        select: { equipeId: true },
      },
    },
  });
  if (!usuario) return null;

  const perfil = perfisCriaveisSchema.safeParse(usuario.perfil);
  if (!perfil.success) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: perfil.data,
    ativo: usuario.ativo,
    estadoAcesso: determinarEstadoAcesso(usuario, agora),
    unidadeIds: usuario.unidades.map(({ unidadeId }) => unidadeId),
    equipeIds: usuario.equipes.map(({ equipeId }) => equipeId),
  };
}
