import "server-only";

import type { Perfil, Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";

export type VinculosResolvidos = {
  unidadeIds: string[];
  equipes: { id: string; unidadeId: string }[];
};

export async function atribuirSupervisor(tx: Transacao, equipeId: string, supervisorId: string): Promise<void> {
  await tx.usuarioEquipe.updateMany({
    where: {
      equipeId,
      usuarioId: { not: supervisorId },
      ativo: true,
      usuario: { perfil: "SUPERVISOR" },
    },
    data: { ativo: false },
  });

  const atualizacao = await tx.equipe.updateMany({
    where: { id: equipeId, OR: [{ supervisorId: null }, { supervisorId }] },
    data: { supervisorId },
  });
  if (atualizacao.count !== 1) {
    throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
  }
}

export function validarFormatoDosVinculos(perfil: Perfil, unidadeIds: string[], equipeIds: string[]) {
  const perfilPorUnidade = perfil === "COORDENACAO" || perfil === "SECRETARIA";
  if (perfilPorUnidade && (unidadeIds.length === 0 || equipeIds.length > 0)) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Informe ao menos uma unidade e nenhuma equipe para este perfil.");
  }
  if (!perfilPorUnidade && (equipeIds.length === 0 || unidadeIds.length > 0)) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Informe ao menos uma equipe; as unidades serão definidas pelas equipes.");
  }
}

export async function resolverVinculos(
  tx: Transacao,
  perfil: Perfil,
  unidadeIds: string[],
  equipeIds: string[],
  autor: ContextoAutorizacao,
  usuarioIdAtual?: string,
): Promise<VinculosResolvidos> {
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
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
      ...whereDeEscopo,
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

  return {
    unidadeIds: [...new Set(equipes.map(({ unidadeId }) => unidadeId))],
    equipes: equipes.map(({ id, unidadeId }) => ({ id, unidadeId })),
  };
}
