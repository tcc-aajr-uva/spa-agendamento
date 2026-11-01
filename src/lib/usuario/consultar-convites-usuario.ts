import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { usuarioIdSchema } from "@/lib/usuario/dados-usuario";
import { determinarEstadoAcesso } from "@/lib/usuario/estado-acesso";
import { filtroDeUsuariosGerenciaveis } from "@/lib/usuario/escopo-usuario";

export async function consultarConvitesDoUsuario(usuarioId: string, autor: ContextoAutorizacao, agora = new Date()) {
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
    },
  });
  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    estadoAcesso: determinarEstadoAcesso(usuario, agora),
  };
}
