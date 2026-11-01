import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import { perfisCriaveisSchema } from "@/lib/usuario/dados-usuario";
import { filtroDeUsuariosGerenciaveis } from "@/lib/usuario/escopo-usuario";
import { atribuirSupervisor } from "@/lib/usuario/vinculos-usuario";

export async function alterarAtivacaoUsuario(
  usuarioId: string,
  ativo: boolean,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const usuario = await tx.usuario.findFirst({
      where: { id: usuarioId, ...filtroDeUsuariosGerenciaveis(autor) },
      select: { perfil: true, ativo: true },
    });
    if (!usuario) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar este usuário.");
    }

    const perfil = perfisCriaveisSchema.safeParse(usuario.perfil);
    if (!perfil.success) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Este perfil não pode ser ativado ou inativado por esta tela.");
    }
    if (usuario.ativo === ativo) return;

    if (ativo) {
      await prepararVinculosParaAtivacao(tx, usuarioId, perfil.data);
    } else {
      await tx.convite.updateMany({
        where: { usuarioId, usadoEm: null, revogadoEm: null },
        data: { revogadoEm: agora },
      });
      await tx.sessaoAutenticacao.deleteMany({ where: { userId: usuarioId } });

      if (perfil.data === "SUPERVISOR") {
        await tx.equipe.updateMany({ where: { supervisorId: usuarioId }, data: { supervisorId: null } });
        await tx.usuarioEquipe.updateMany({ where: { usuarioId }, data: { ativo: false } });
      }
    }

    await tx.usuario.update({ where: { id: usuarioId }, data: { ativo } });
  });
}

async function prepararVinculosParaAtivacao(
  tx: Transacao,
  usuarioId: string,
  perfil: "COORDENACAO" | "SECRETARIA" | "SUPERVISOR" | "ESTAGIARIO",
) {
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    const unidades = await tx.usuarioUnidade.count({
      where: { usuarioId, ativo: true, unidade: { ativa: true } },
    });
    if (unidades === 0) throw new ErroDeRegra("DADOS_INVALIDOS", "Defina ao menos uma unidade antes de ativar.");
    return;
  }

  if (perfil === "SUPERVISOR") {
    const equipes = await tx.usuarioEquipe.findMany({
      where: {
        usuarioId,
        ativo: true,
        vinculoUnidade: { ativo: true },
        equipe: { ativa: true, unidade: { ativa: true } },
      },
      select: { equipeId: true, equipe: { select: { supervisorId: true } } },
    });
    if (equipes.length === 0) {
      throw new ErroDeRegra("DADOS_INVALIDOS", "Defina ao menos uma equipe antes de ativar.");
    }
    if (equipes.some(({ equipe }) => equipe.supervisorId !== null && equipe.supervisorId !== usuarioId)) {
      throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
    }

    for (const { equipeId } of equipes) {
      await atribuirSupervisor(tx, equipeId, usuarioId);
    }
    return;
  }

  const equipes = await tx.usuarioEquipe.count({
    where: {
      usuarioId,
      ativo: true,
      vinculoUnidade: { ativo: true },
      equipe: {
        ativa: true,
        unidade: { ativa: true },
        supervisorId: { not: null },
      },
    },
  });
  if (equipes === 0) throw new ErroDeRegra("DADOS_INVALIDOS", "Defina ao menos uma equipe antes de ativar.");
}
