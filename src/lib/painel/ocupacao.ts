import "server-only";

import { chaveSala, estaOcupando, hojeNoBrasil } from "@/lib/agendamento/regras";
import { filtroDeIdsDasUnidades, podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";

export type SituacaoCelula = "LIVRE" | "OCUPADA" | "PENDENTE";

export type GradeDeOcupacao = {
  salas: { id: string; nome: string }[];
  linhas: { horaInicio: number; celulas: SituacaoCelula[] }[];
};

export function listarUnidadesDoPainel(usuario: ContextoAutorizacao) {
  return prisma.unidade.findMany({
    where: filtroDeIdsDasUnidades(usuario),
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}

export async function obterGradeDeOcupacao(
  usuario: ContextoAutorizacao,
  unidadeId: string,
  diaSemana: number,
  agora: Date,
): Promise<GradeDeOcupacao> {
  if (!podeAcessar(usuario, { unidadeId })) return { salas: [], linhas: [] };

  const [salas, agendamentos] = await Promise.all([
    prisma.sala.findMany({ where: { unidadeId, ativa: true }, select: { id: true, nome: true } }),
    prisma.agendamento.findMany({
      where: { unidadeId, diaSemana, dataFim: { gte: hojeNoBrasil(agora) } },
      select: { salaId: true, horaInicio: true, status: true, prazoConfirmacao: true, horarioAtivoId: true },
    }),
  ]);

  salas.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }));

  const horas = new Set<number>();
  const situacoes = new Map<string, SituacaoCelula>();
  for (const agendamento of agendamentos) {
    horas.add(agendamento.horaInicio);
    if (estaOcupando(agendamento, agora)) {
      const chave = chaveSala(agendamento.salaId, diaSemana, agendamento.horaInicio);
      situacoes.set(chave, agendamento.status === "PENDENTE" ? "PENDENTE" : "OCUPADA");
    }
  }

  const linhas = [...horas]
    .sort((a, b) => a - b)
    .map((horaInicio) => ({
      horaInicio,
      celulas: salas.map((sala) => situacoes.get(chaveSala(sala.id, diaSemana, horaInicio)) ?? "LIVRE"),
    }));

  return { salas, linhas };
}