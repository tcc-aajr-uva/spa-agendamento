import "server-only";
import type { Perfil, Prisma } from "@/generated/prisma/client";
import { filtroDeUnidade, podeAcessar } from "@/lib/auth/permissao";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";

export const PERFIS_DO_ATENDIMENTO: Perfil[] = ["ESTAGIARIO", "SECRETARIA", "COORDENACAO"];
export const PERFIS_DA_SECRETARIA: Perfil[] = ["SECRETARIA", "COORDENACAO"];

export type FiltrosDosAtendimentos = {
  equipeId?: string;
  estagiarioId?: string;
};

export function filtroDosAtendimentos(usuario: UsuarioAtual, filtros: FiltrosDosAtendimentos = {}): Prisma.AgendamentoWhereInput {
  if (usuario.perfil === "ESTAGIARIO") return { estagiarioId: usuario.id };
  return {
    ...filtroDeUnidade(usuario),
    ...(filtros.equipeId ? { equipeId: filtros.equipeId } : {}),
    ...(filtros.estagiarioId ? { estagiarioId: filtros.estagiarioId } : {}),
  };
}

export async function carregarAgendamentoAtivo(
  tx: Transacao,
  agendamentoId: string,
  usuario: UsuarioAtual,
  perfis: Perfil[] = PERFIS_DO_ATENDIMENTO,
) {
  if (!perfis.includes(usuario.perfil)) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar este atendimento.");

  const agendamento = await tx.agendamento.findFirst({
    where: { id: agendamentoId, horarioAtivoId: { not: null } },
    select: {
      id: true,
      unidadeId: true,
      equipeId: true,
      estagiarioId: true,
      salaId: true,
      status: true,
      prazoConfirmacao: true,
      diaSemana: true,
      horaInicio: true,
      dataInicio: true,
      dataFim: true,
      termoAssinadoEm: true,
    },
  });
  if (!agendamento) throw new ErroDeRegra("NAO_ENCONTRADO", "Atendimento não encontrado ou já encerrado.");
  if (!podeAcessar(usuario, agendamento)) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar este atendimento.");
  return agendamento;
}
