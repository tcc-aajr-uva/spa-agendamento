import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { hojeNoBrasil } from "@/lib/agendamento/regras";
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
  podeGerenciarVinculoDeEquipe,
  podeGerenciarVinculoDeUnidade,
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

    await validarAlteracaoDosVinculos(tx, usuarioId, perfil.data, vinculos, autor);

    const gravacao = await tx.usuario.updateMany({
      where: { id: usuarioId, atualizadoEm: versao }, data: { nome: dados.nome },
    });
    if (gravacao.count !== 1) throw new VersaoDesatualizadaDoUsuario();
    if (autor.perfil !== "SUPERVISOR") {
      await sincronizarUnidadesDiretas(tx, usuarioId, vinculos.unidadeIds, autor);
    }
    if (perfil.data === "SUPERVISOR" || perfil.data === "ESTAGIARIO") {
      await sincronizarEquipes(tx, usuarioId, perfil.data, usuario.ativo, vinculos.equipes, autor);
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
    if (perfil === "ESTAGIARIO") {
      const anterior = await tx.usuarioEquipe.findUnique({
        where: { usuarioId_equipeId: { usuarioId, equipeId: equipe.id } }, select: { ativo: true },
      });
      if (!anterior?.ativo) await tx.configuracaoAtendimentoEstagiario.updateMany({
        where: { estagiarioId: usuarioId, equipeId: equipe.id, periodoLetivo: { fim: { gte: hojeNoBrasil(new Date()) } } },
        data: { liberado: false, limitePacientes: 0 },
      });
    }
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

async function validarAlteracaoDosVinculos(
  tx: Transacao, usuarioId: string, perfil: "COORDENACAO" | "SECRETARIA" | "SUPERVISOR" | "ESTAGIARIO",
  novos: { unidadeIds: string[]; equipes: { id: string; unidadeId: string }[] }, autor: ContextoAutorizacao,
) {
  const unidades = await tx.usuarioUnidade.findMany({
    where: { usuarioId, ativo: true }, select: { unidadeId: true, unidade: { select: { ativa: true } } },
  });
  const equipes = await tx.usuarioEquipe.findMany({
    where: { usuarioId, ativo: true },
    select: { equipeId: true, unidadeId: true, equipe: { select: { ativa: true, supervisorId: true, unidade: { select: { ativa: true } } } } },
  });
  const unidadesGerenciaveis = unidades.filter(({ unidadeId, unidade }) =>
    unidade.ativa && podeGerenciarVinculoDeUnidade(autor, unidadeId),
  );
  if (autor.perfil === "SUPERVISOR" && (
    novos.unidadeIds.length !== unidadesGerenciaveis.length ||
    novos.unidadeIds.some((id) => !unidadesGerenciaveis.some(({ unidadeId }) => unidadeId === id))
  )) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Somente o administrador, a coordenação ou a secretaria pode alterar unidades.");
  }
  const unidadesRemovidas = unidadesGerenciaveis.filter(({ unidadeId }) => !novos.unidadeIds.includes(unidadeId));
  const unidadesFinais = [...new Set([
    ...novos.unidadeIds,
    ...unidades.filter((unidade) => !unidadesGerenciaveis.includes(unidade)).map(({ unidadeId }) => unidadeId),
  ])];
  validarFormatoDosVinculos(perfil, unidadesFinais, novos.equipes.map(({ id }) => id));

  if (equipes.some(({ unidadeId }) => unidadesRemovidas.some((unidade) => unidade.unidadeId === unidadeId))) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Remova os vínculos com equipes antes de retirar a unidade do usuário.");
  }
  if (perfil !== "ESTAGIARIO") return;
  const unidadeMudou = unidades.some(({ unidadeId }) => !unidadesFinais.includes(unidadeId));
  if (unidadeMudou) {
    const [horario, atendimento] = await Promise.all([
      tx.horarioDisponivel.findFirst({ where: { estagiarioId: usuarioId }, select: { id: true } }),
      tx.agendamento.findFirst({ where: { estagiarioId: usuarioId }, select: { id: true } }),
    ]);
    if (horario || atendimento) throw new ErroDeRegra(
      "DADOS_INVALIDOS", "Não é possível trocar a unidade de um estagiário com horários ou histórico de atendimentos.",
    );
  }
  const removidas = equipes.filter(({ equipeId, unidadeId, equipe }) =>
    equipe.ativa && equipe.unidade.ativa &&
    podeGerenciarVinculoDeEquipe(autor, { equipeId, unidadeId, supervisorId: equipe.supervisorId }) &&
    !novos.equipes.some(({ id }) => id === equipeId),
  );
  if (removidas.length > 0) {
    const atendimento = await tx.agendamento.findFirst({
      where: { estagiarioId: usuarioId, equipeId: { in: removidas.map(({ equipeId }) => equipeId) }, horarioAtivoId: { not: null } },
      select: { id: true },
    });
    if (atendimento) throw new ErroDeRegra("DADOS_INVALIDOS", "Não é possível remover uma equipe com atendimentos ativos do estagiário.");
  }
}
