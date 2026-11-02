import "server-only";
import { podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";
import { hojeNoBrasil } from "@/lib/agendamento/regras";

type ConfiguracaoUnidade = {
  agendamentoAberto: boolean;
  permitePaciente: boolean;
  permiteEstagiario: boolean;
  permiteSecretaria: boolean;
};

export function autorizarAgendamento(
  unidade: ConfiguracaoUnidade & { id: string },
  equipeId: string,
  usuario: ContextoAutorizacao | null,
  vindoDaListaDeEspera = false,
): void {
  if (!usuario) {
    if (!unidade.permitePaciente || !unidade.agendamentoAberto) {
      throw new ErroDeRegra("UNIDADE_FECHADA", "O agendamento online está fechado nesta unidade.");
    }
    return;
  }

  if (usuario.perfil === "ESTAGIARIO") {
    if (!unidade.permiteEstagiario || !usuario.equipes.includes(equipeId)) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode agendar para esta equipe.");
    }
    if (!unidade.agendamentoAberto && !vindoDaListaDeEspera) {
      throw new ErroDeRegra("UNIDADE_FECHADA", "O agendamento está fechado nesta unidade.");
    }
    return;
  }

  if (usuario.perfil !== "SECRETARIA" || !unidade.permiteSecretaria || !podeAcessar(usuario, { unidadeId: unidade.id })) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode agendar nesta unidade.");
  }
}

export async function carregarUnidadeParaAgendar(tx: Transacao, unidadeId: string, equipeId: string, agora: Date) {
  const unidade = await tx.unidade.findFirst({
    where: { id: unidadeId, ativa: true, equipes: { some: { id: equipeId, ativa: true } } },
    select: {
      id: true,
      agendamentoAberto: true,
      permitePaciente: true,
      permiteEstagiario: true,
      permiteSecretaria: true,
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
