import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import { perfisCriaveisSchema } from "@/lib/usuario/dados-usuario";
import {
  filtroDeUsuariosGerenciaveis,
  podeAlterarAcessoDoUsuario,
} from "@/lib/usuario/escopo-usuario";
import { atribuirSupervisor, validarFormatoDosVinculos } from "@/lib/usuario/vinculos-usuario";
import { VersaoDesatualizadaDoUsuario } from "./versao-usuario";

export async function alterarAtivacaoUsuario(
  usuarioId: string,
  ativo: boolean,
  versao: Date,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<Date> {
  if (autor.perfil !== "ADMINISTRADOR" && autor.perfil !== "COORDENACAO") {
    throw new ErroDeRegra("SEM_PERMISSAO", "Seu perfil não pode alterar o acesso global de usuários.");
  }

  return executarEmTransacao(async (tx) => {
    const usuario = await tx.usuario.findFirst({
      where: { id: usuarioId, ...filtroDeUsuariosGerenciaveis(autor) },
      select: {
        perfil: true,
        ativo: true,
        atualizadoEm: true,
        unidades: {
          where: { ativo: true, unidade: { ativa: true } },
          select: { unidadeId: true },
        },
      },
    });
    if (!usuario) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar este usuário.");
    }

    const perfil = perfisCriaveisSchema.safeParse(usuario.perfil);
    if (!perfil.success) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Este perfil não pode ser ativado ou inativado por esta tela.");
    }
    if (!podeAlterarAcessoDoUsuario(autor, usuario.unidades.map(({ unidadeId }) => unidadeId))) {
      throw new ErroDeRegra(
        "SEM_PERMISSAO",
        "Somente uma coordenação responsável por todas as unidades do usuário pode alterar seu acesso.",
      );
    }
    if (usuario.atualizadoEm.getTime() !== versao.getTime()) throw new VersaoDesatualizadaDoUsuario();
    if (usuario.ativo === ativo) return usuario.atualizadoEm;

    const gravacao = await tx.usuario.updateMany({
      where: { id: usuarioId, atualizadoEm: versao }, data: { ativo },
    });
    if (gravacao.count !== 1) throw new VersaoDesatualizadaDoUsuario();

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
      }
    }

    const salvo = await tx.usuario.findUniqueOrThrow({ where: { id: usuarioId }, select: { atualizadoEm: true } });
    return salvo.atualizadoEm;
  });
}

async function prepararVinculosParaAtivacao(
  tx: Transacao,
  usuarioId: string,
  perfil: "COORDENACAO" | "SECRETARIA" | "SUPERVISOR" | "ESTAGIARIO",
) {
  const unidades = await tx.usuarioUnidade.findMany({
    where: { usuarioId, ativo: true, unidade: { ativa: true } },
    select: { unidadeId: true },
  });
  validarFormatoDosVinculos(perfil, unidades.map(({ unidadeId }) => unidadeId), []);

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
    if (equipes.some(({ equipe }) => equipe.supervisorId !== null && equipe.supervisorId !== usuarioId)) {
      throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
    }

    for (const { equipeId } of equipes) {
      await atribuirSupervisor(tx, equipeId, usuarioId);
    }
  }
}
