import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Transacao } from "@/lib/transacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { hojeNoBrasil } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { dataDoPeriodo, periodoIdSchema, situacaoDoPeriodo } from "./dados-periodo";
import { filtroDeUnidadesDosPeriodos, podeGerenciarPeriodos } from "./escopo-periodo";

type Periodo = { id: string; unidadeId: string; inicio: Date; fim: Date };

export function filtroDeAgendamentosDoPeriodo(periodo: Pick<Periodo, "unidadeId" | "inicio" | "fim">): Prisma.AgendamentoWhereInput {
  return { unidadeId: periodo.unidadeId, dataInicio: { lte: periodo.fim }, dataFim: { gte: periodo.inicio } };
}

export async function periodoEstaEmUso(
  periodo: Periodo, cliente: Pick<Transacao, "configuracaoAtendimentoEstagiario" | "agendamento"> = prisma,
): Promise<boolean> {
  const uso = await consultarUsoPeriodo(periodo, cliente);
  return uso.configuracoes > 0 || uso.agendamentos > 0;
}

async function consultarUsoPeriodo(
  periodo: Periodo, cliente: Pick<Transacao, "configuracaoAtendimentoEstagiario" | "agendamento"> = prisma,
) {
  const [configuracoes, agendamentos] = await Promise.all([
    cliente.configuracaoAtendimentoEstagiario.count({ where: { periodoLetivoId: periodo.id, unidadeId: periodo.unidadeId } }),
    cliente.agendamento.count({ where: filtroDeAgendamentosDoPeriodo(periodo) }),
  ]);
  return { configuracoes, agendamentos };
}

export async function consultarPeriodo(unidadeId: string, id: string, autor: ContextoAutorizacao) {
  if (!periodoIdSchema.safeParse(id).success || !periodoIdSchema.safeParse(unidadeId).success) return null;
  const periodo = await prisma.periodoLetivo.findFirst({
    where: { id, unidadeId, unidade: filtroDeUnidadesDosPeriodos(autor) },
    select: { id: true, unidadeId: true, inicio: true, fim: true, unidade: { select: { nome: true } } },
  });
  if (!periodo) return null;
  const uso = await consultarUsoPeriodo(periodo);
  const emUso = uso.configuracoes > 0 || uso.agendamentos > 0;
  const datas = { inicio: dataDoPeriodo(periodo.inicio), fim: dataDoPeriodo(periodo.fim) };
  const situacao = situacaoDoPeriodo(datas, dataDoPeriodo(hojeNoBrasil(new Date())));
  const podeGerenciar = podeGerenciarPeriodos(autor);
  const motivosBloqueioExclusao: string[] = [];
  if (situacao !== "FUTURO") motivosBloqueioExclusao.push("Somente períodos com início após a data de hoje podem ser excluídos.");
  if (uso.configuracoes > 0) motivosBloqueioExclusao.push(
    `${uso.configuracoes} ${uso.configuracoes === 1 ? "configuração de atendimento vinculada ao período." : "configurações de atendimento vinculadas ao período."}`,
  );
  if (uso.agendamentos > 0) motivosBloqueioExclusao.push(
    `${uso.agendamentos} ${uso.agendamentos === 1 ? "agendamento da unidade com datas que cruzam este período." : "agendamentos da unidade com datas que cruzam este período."}`,
  );
  return {
    ...periodo, ...datas, situacao, emUso, podeGerenciar, motivosBloqueioExclusao,
    podeEditar: podeGerenciar && !emUso,
    podeExcluir: podeGerenciar && motivosBloqueioExclusao.length === 0,
  };
}
