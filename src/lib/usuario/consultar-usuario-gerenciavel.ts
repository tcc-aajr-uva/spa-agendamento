import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { perfisCriaveisSchema, usuarioIdSchema } from "@/lib/usuario/dados-usuario";
import { determinarEstadoAcesso } from "@/lib/usuario/estado-acesso";
import {
  filtroDeUsuariosGerenciaveis,
  podeAlterarAcessoDoUsuario,
  podeGerenciarVinculoDeEquipe,
  podeGerenciarVinculoDeUnidade,
} from "@/lib/usuario/escopo-usuario";

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
      atualizadoEm: true,
      accounts: {
        where: { providerId: "credential" },
        take: 1,
        select: { id: true },
      },
      convites: {
        orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
        take: 1,
        select: { expiraEm: true, usadoEm: true, revogadoEm: true },
      },
      unidades: {
        where: { ativo: true, unidade: { ativa: true } },
        select: { unidadeId: true },
      },
      equipes: {
        where: { ativo: true, vinculoUnidade: { ativo: true }, equipe: { ativa: true } },
        select: { equipeId: true, unidadeId: true, equipe: { select: { supervisorId: true } } },
      },
    },
  });
  if (!usuario) return null;

  const perfil = perfisCriaveisSchema.safeParse(usuario.perfil);
  if (!perfil.success) return null;
  const todasAsUnidades = usuario.unidades.map(({ unidadeId }) => unidadeId);
  const unidadesGerenciaveis = usuario.unidades.filter(({ unidadeId }) =>
    podeGerenciarVinculoDeUnidade(autor, unidadeId),
  );
  const equipesGerenciaveis = usuario.equipes.filter(({ equipeId, unidadeId, equipe }) =>
    podeGerenciarVinculoDeEquipe(autor, { equipeId, unidadeId, supervisorId: equipe.supervisorId }),
  );

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: perfil.data,
    ativo: usuario.ativo,
    atualizadoEm: usuario.atualizadoEm,
    estadoAcesso: determinarEstadoAcesso(usuario, agora),
    podeAlterarAcesso: podeAlterarAcessoDoUsuario(autor, todasAsUnidades),
    possuiVinculosForaDoEscopo: unidadesGerenciaveis.length < usuario.unidades.length || equipesGerenciaveis.length < usuario.equipes.length,
    unidadeIds: unidadesGerenciaveis.map(({ unidadeId }) => unidadeId),
    equipeIds: equipesGerenciaveis.map(({ equipeId }) => equipeId),
  };
}
