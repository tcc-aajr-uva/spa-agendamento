import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import { VersaoDesatualizadaDoUsuario } from "./versao-usuario";
import {
  atualizacaoUsuarioSchema,
  perfisCriaveisSchema,
  type AtualizacaoUsuario,
} from "@/lib/usuario/dados-usuario";
import {
  filtroDeUsuariosGerenciaveis,
  filtroDeVinculosDeEquipeGerenciaveis,
  filtroDeVinculosDeUnidadeGerenciaveis,
} from "@/lib/usuario/escopo-usuario";
import {
  atribuirSupervisor,
  resolverVinculos,
  validarFormatoDosVinculos,
} from "@/lib/usuario/vinculos-usuario";

export async function atualizarUsuarioGerenciavel(
  usuarioId: string,
  entrada: AtualizacaoUsuario,
  versao: Date,
  autor: ContextoAutorizacao,
): Promise<Date> {
  const resultado = atualizacaoUsuarioSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  return executarEmTransacao(async (tx) => {
    const usuario = await tx.usuario.findFirst({
      where: { id: usuarioId, ...filtroDeUsuariosGerenciaveis(autor) },
      select: { perfil: true, ativo: true, atualizadoEm: true },
    });
    if (!usuario) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar este usuário.");
    }
    if (usuario.atualizadoEm.getTime() !== versao.getTime()) throw new VersaoDesatualizadaDoUsuario();

    const perfil = perfisCriaveisSchema.safeParse(usuario.perfil);
    if (!perfil.success) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Este perfil não pode ser alterado por esta tela.");
    }

    const dados = resultado.data;
    validarFormatoDosVinculos(perfil.data, dados.unidadeIds, dados.equipeIds, false);
    const vinculos = await resolverVinculos(
      tx,
      perfil.data,
      dados.unidadeIds,
      dados.equipeIds,
      autor,
      usuarioId,
    );

    const gravacao = await tx.usuario.updateMany({
      where: { id: usuarioId, atualizadoEm: versao }, data: { nome: dados.nome },
    });
    if (gravacao.count !== 1) throw new VersaoDesatualizadaDoUsuario();
    if (perfil.data === "COORDENACAO" || perfil.data === "SECRETARIA") {
      await sincronizarUnidadesDiretas(tx, usuarioId, vinculos.unidadeIds, autor);
    } else {
      await sincronizarEquipes(tx, usuarioId, perfil.data, usuario.ativo, vinculos.equipes, autor);
      await desativarUnidadesSemVinculosAtivosDeEquipe(tx, usuarioId);
      if (perfil.data === "ESTAGIARIO") await validarUnicaUnidadeDoEstagiario(tx, usuarioId);
    }
    const salvo = await tx.usuario.findUniqueOrThrow({ where: { id: usuarioId }, select: { atualizadoEm: true } });
    return salvo.atualizadoEm;
  });
}

async function sincronizarUnidadesDiretas(
  tx: Transacao,
  usuarioId: string,
  unidadeIds: string[],
  autor: ContextoAutorizacao,
) {
  await tx.usuarioUnidade.updateMany({
    where: {
      usuarioId,
      ativo: true,
      unidade: { ativa: true },
      AND: [filtroDeVinculosDeUnidadeGerenciaveis(autor), { unidadeId: { notIn: unidadeIds } }],
    },
    data: { ativo: false },
  });
  for (const unidadeId of unidadeIds) {
    await tx.usuarioUnidade.upsert({
      where: { usuarioId_unidadeId: { usuarioId, unidadeId } },
      create: { usuarioId, unidadeId },
      update: { ativo: true },
    });
  }
}

async function sincronizarEquipes(
  tx: Transacao,
  usuarioId: string,
  perfil: "COORDENACAO" | "SECRETARIA" | "SUPERVISOR" | "ESTAGIARIO",
  usuarioAtivo: boolean,
  equipes: { id: string; unidadeId: string }[],
  autor: ContextoAutorizacao,
) {
  const equipeIds = equipes.map(({ id }) => id);
  const filtroDeRemocao = {
    usuarioId,
    ativo: true,
    vinculoUnidade: { ativo: true },
    equipe: { ativa: true, unidade: { ativa: true } },
    AND: [filtroDeVinculosDeEquipeGerenciaveis(autor), { equipeId: { notIn: equipeIds } }],
  };

  if (perfil === "SUPERVISOR") {
    const vinculosRemovidos = await tx.usuarioEquipe.findMany({
      where: filtroDeRemocao,
      select: { equipeId: true },
    });
    await tx.equipe.updateMany({
      where: { supervisorId: usuarioId, id: { in: vinculosRemovidos.map(({ equipeId }) => equipeId) } },
      data: { supervisorId: null },
    });
  }

  await tx.usuarioEquipe.updateMany({
    where: filtroDeRemocao,
    data: { ativo: false },
  });

  for (const equipe of equipes) {
    await tx.usuarioUnidade.upsert({
      where: { usuarioId_unidadeId: { usuarioId, unidadeId: equipe.unidadeId } },
      create: { usuarioId, unidadeId: equipe.unidadeId },
      update: { ativo: true },
    });
    await tx.usuarioEquipe.upsert({
      where: { usuarioId_equipeId: { usuarioId, equipeId: equipe.id } },
      create: { usuarioId, equipeId: equipe.id, unidadeId: equipe.unidadeId },
      update: { unidadeId: equipe.unidadeId, ativo: true },
    });

    if (perfil === "SUPERVISOR" && usuarioAtivo) {
      await atribuirSupervisor(tx, equipe.id, usuarioId);
    }
  }
}

async function desativarUnidadesSemVinculosAtivosDeEquipe(tx: Transacao, usuarioId: string) {
  await tx.usuarioUnidade.updateMany({
    where: { usuarioId, equipes: { none: { ativo: true } } },
    data: { ativo: false },
  });
}

async function validarUnicaUnidadeDoEstagiario(tx: Transacao, usuarioId: string) {
  const unidades = await tx.usuarioUnidade.count({ where: { usuarioId, ativo: true } });
  if (unidades > 1) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "O estagiário deve pertencer a equipes da mesma unidade.");
  }
}
