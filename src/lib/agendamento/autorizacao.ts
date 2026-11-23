import "server-only";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";
import { hojeNoBrasil } from "@/lib/agendamento/regras";

export async function carregarUnidadeParaAgendar(tx: Transacao, unidadeId: string, equipeId: string, agora: Date) {
  const unidade = await tx.unidade.findFirst({
    where: { id: unidadeId, ativa: true, equipes: { some: { id: equipeId, ativa: true } } },
    select: {
      id: true,
      horaAbertura: true,
      horaFechamento: true,
      duracaoBlocoMin: true,
      periodos: {
        where: { fim: { gte: hojeNoBrasil(agora) } },
        orderBy: { inicio: "asc" },
        take: 1,
        select: { id: true, inicio: true, fim: true },
      },
    },
  });
  if (!unidade) throw new ErroDeRegra("NAO_ENCONTRADO", "Unidade ou equipe não encontrada.");
  return unidade;
}

export async function garantirPacienteSemVinculoAtivo(tx: Transacao, cpf: string, listaEsperaPermitidaId?: string): Promise<void> {
  const paciente = await tx.paciente.findUnique({
    where: { cpf },
    select: { agendamentoAtivo: { select: { id: true } }, posicaoAtiva: { select: { id: true } } },
  });
  if (!paciente) return;
  const naListaDeOutraInscricao = paciente.posicaoAtiva !== null && paciente.posicaoAtiva.id !== listaEsperaPermitidaId;
  if (paciente.agendamentoAtivo || naListaDeOutraInscricao) {
    throw new ErroDeRegra("PACIENTE_JA_ATIVO", "Este CPF já tem um agendamento ativo ou uma posição na lista de espera.");
  }
}
