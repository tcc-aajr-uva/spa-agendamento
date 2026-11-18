import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { hojeNoBrasil } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { listarEstagiariosDaEquipe } from "./listar-estagiarios-equipe";

type Filtros = { busca?: string; pagina?: string };

export async function listarAtendimentoVigenteDaEquipe(equipeId: string, filtros: Filtros, autor: ContextoAutorizacao, agora = new Date()) {
  const resultado = await listarEstagiariosDaEquipe(equipeId, { busca: filtros.busca ?? "", pagina: filtros.pagina ?? "1" }, autor);
  if (!resultado) return null;
  const hoje = hojeNoBrasil(agora);
  const periodo = await prisma.periodoLetivo.findFirst({
    where: { unidadeId: resultado.equipe.unidadeId, inicio: { lte: hoje }, fim: { gte: hoje } },
    orderBy: [{ inicio: "asc" }, { id: "asc" }],
    select: { id: true, inicio: true, fim: true },
  });
  const equipeDisponivel = resultado.equipe.ativa && resultado.equipe.unidade.ativa;
  const idsDisponiveis = equipeDisponivel
    ? resultado.estagiarios.filter(({ ativo }) => ativo).map(({ id }) => id)
    : [];
  const configuracoes = periodo && idsDisponiveis.length > 0 ? await prisma.configuracaoAtendimentoEstagiario.findMany({
    where: { equipeId, periodoLetivoId: periodo.id, estagiarioId: { in: idsDisponiveis } },
    select: { estagiarioId: true, liberado: true, limitePacientes: true },
  }) : [];
  const porEstagiario = new Map(configuracoes.map((configuracao) => [configuracao.estagiarioId, configuracao]));

  return {
    ...resultado, periodo, equipeDisponivel,
    estagiarios: resultado.estagiarios.map((estagiario) => ({
      ...estagiario,
      disponivel: equipeDisponivel && estagiario.ativo,
      configuracao: porEstagiario.get(estagiario.id) ?? null,
    })),
  };
}
