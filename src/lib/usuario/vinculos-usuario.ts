import "server-only";

import type { Perfil, Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";
import { erroDeFormatoDosVinculos } from "./regras-vinculos";

export type VinculosResolvidos = {
  unidadeIds: string[];
  equipes: { id: string; unidadeId: string }[];
};

export async function atribuirSupervisor(
  tx: Transacao,
  equipeId: string,
  supervisorId: string | null,
  supervisorAtualEsperado?: string | null,
): Promise<void> {
  const equipe = await tx.equipe.findUnique({
    where: { id: equipeId }, select: { unidadeId: true, supervisorId: true },
  });
  if (!equipe) throw new ErroDeRegra("NAO_ENCONTRADO", "Equipe não encontrada.");
  if (supervisorAtualEsperado !== undefined && equipe.supervisorId !== supervisorAtualEsperado) {
    throw new ErroDeRegra("CONFLITO_CONCORRENTE", "O responsável pela equipe foi alterado. Atualize a página.");
  }
  if (supervisorAtualEsperado === undefined && equipe.supervisorId !== null && equipe.supervisorId !== supervisorId) {
    throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
  }

  if (supervisorId !== null) {
    const supervisor = await tx.usuario.findFirst({
      where: { id: supervisorId, perfil: "SUPERVISOR", unidades: { some: { unidadeId: equipe.unidadeId, ativo: true } } },
      select: { id: true },
    });
    if (!supervisor) throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um supervisor vinculado à unidade da equipe.");
    await tx.usuarioEquipe.upsert({
      where: { usuarioId_equipeId: { usuarioId: supervisorId, equipeId } },
      create: { usuarioId: supervisorId, equipeId, unidadeId: equipe.unidadeId }, update: { ativo: true },
    });
  }

  const filtroDeRemocao: Prisma.UsuarioEquipeWhereInput = {
    equipeId,
    ...(supervisorId ? { usuarioId: { not: supervisorId } } : {}),
    ativo: true,
    usuario: { perfil: "SUPERVISOR" },
  };
  const removidos = await tx.usuarioEquipe.findMany({ where: filtroDeRemocao, select: { usuarioId: true } });
  const atualizacao = await tx.equipe.updateMany({
    where: { id: equipeId, supervisorId: equipe.supervisorId }, data: { supervisorId },
  });
  if (atualizacao.count !== 1) {
    throw new ErroDeRegra("CONFLITO_CONCORRENTE", "O responsável pela equipe foi alterado. Atualize a página.");
  }
  await tx.usuarioEquipe.updateMany({
    where: filtroDeRemocao, data: { ativo: false },
  });
  const anteriores = new Set(removidos.map(({ usuarioId }) => usuarioId));
  if (equipe.supervisorId !== null && equipe.supervisorId !== supervisorId) anteriores.add(equipe.supervisorId);
  if (supervisorId !== null) anteriores.add(supervisorId);
  if (anteriores.size > 0) {
    await tx.usuario.updateMany({
      where: { id: { in: [...anteriores] } },
      data: { atualizadoEm: new Date() },
    });
  }
}

export function validarFormatoDosVinculos(
  perfil: Perfil,
  unidadeIds: string[],
  equipeIds: string[],
  exigeUnidade = true,
) {
  const erro = erroDeFormatoDosVinculos(perfil, unidadeIds, equipeIds, exigeUnidade);
  if (erro) throw new ErroDeRegra("DADOS_INVALIDOS", erro.mensagem);
}

export async function resolverVinculos(
  tx: Transacao,
  perfil: Perfil,
  unidadeIds: string[],
  equipeIds: string[],
  autor: ContextoAutorizacao,
  usuarioIdAtual?: string,
): Promise<VinculosResolvidos> {
  if (autor.perfil !== "ADMINISTRADOR" && unidadeIds.some((id) => !autor.unidades.includes(id))) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode vincular usuários fora das suas unidades.");
  }

  const unidades = await tx.unidade.findMany({
    where: { id: { in: unidadeIds }, ativa: true },
    select: { id: true },
  });
  if (unidades.length !== unidadeIds.length) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Uma das unidades não existe ou está inativa.");
  }
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    return { unidadeIds, equipes: [] };
  }

  const whereDeEscopo: Prisma.EquipeWhereInput =
    autor.perfil === "ADMINISTRADOR"
      ? {}
      : autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA"
        ? { unidadeId: { in: autor.unidades } }
        : { id: { in: autor.equipes }, supervisorId: autor.id };

  const exigeSupervisorResponsavel =
    perfil === "ESTAGIARIO" && (autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO");

  const equipes = await tx.equipe.findMany({
    where: {
      id: { in: equipeIds },
      ativa: true,
      unidade: { ativa: true },
      AND: [whereDeEscopo],
      ...(exigeSupervisorResponsavel
        ? {
            OR: [
              { supervisorId: { not: null } },
              ...(usuarioIdAtual
                ? [{ membros: { some: { usuarioId: usuarioIdAtual, ativo: true } } }]
                : []),
            ],
          }
        : {}),
    },
    select: { id: true, unidadeId: true, supervisorId: true },
  });

  if (equipes.length !== equipeIds.length) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Uma das equipes não pertence ao seu escopo ou está inativa.");
  }
  if (
    perfil === "SUPERVISOR" &&
    equipes.some(({ supervisorId }) => supervisorId !== null && supervisorId !== usuarioIdAtual)
  ) {
    throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
  }
  if (equipes.some(({ unidadeId }) => !unidadeIds.includes(unidadeId))) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "As equipes devem pertencer às unidades selecionadas.");
  }
  if (autor.perfil === "SUPERVISOR" && !usuarioIdAtual && equipes.length === 0) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Selecione uma equipe sob sua responsabilidade para cadastrar o estagiário.");
  }

  return {
    unidadeIds,
    equipes: equipes.map(({ id, unidadeId }) => ({ id, unidadeId })),
  };
}
