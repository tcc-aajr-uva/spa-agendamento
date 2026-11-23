import "server-only";
import { z } from "zod";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { contarCarga } from "@/lib/lista-espera/carga";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";
import { carregarAgendamentoAtivo, PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { chaveEstagiario, DIAS_DA_SEMANA, formatarHora, hojeNoBrasil } from "@/lib/agendamento/regras";

export type EstagiarioParaTransferencia = { id: string; nome: string };

const transferenciaSchema = z.object({
  estagiarioId: z.string().min(1, "Escolha o novo estagiário."),
});

type Atendimento = Awaited<ReturnType<typeof carregarAgendamentoAtivo>>;

async function estagiariosElegiveis(tx: Transacao, agendamento: Atendimento, agora: Date, estagiarioId?: string): Promise<EstagiarioParaTransferencia[]> {
  const periodo = await tx.periodoLetivo.findFirst({
    where: { unidadeId: agendamento.unidadeId, fim: { gte: hojeNoBrasil(agora) } },
    orderBy: { inicio: "asc" },
    select: { id: true },
  });
  if (!periodo) return [];

  const configuracoes = await tx.configuracaoAtendimentoEstagiario.findMany({
    where: {
      equipeId: agendamento.equipeId,
      periodoLetivoId: periodo.id,
      liberado: true,
      vinculoEquipe: { ativo: true },
      estagiario: { perfil: "ESTAGIARIO", ativo: true },
      ...(estagiarioId ? { estagiarioId } : {}),
      NOT: { estagiarioId: agendamento.estagiarioId },
    },
    orderBy: { estagiario: { nome: "asc" } },
    select: { limitePacientes: true, estagiario: { select: { id: true, nome: true } } },
  });
  const ids = configuracoes.map(({ estagiario }) => estagiario.id);
  const [carga, ocupados] = await Promise.all([
    contarCarga(tx, ids),
    tx.agendamento.findMany({
      where: { estagiarioAtivoChave: { in: ids.map((id) => chaveEstagiario(id, agendamento.diaSemana, agendamento.horaInicio)) } },
      select: { estagiarioId: true },
    }),
  ]);
  const ocupadosNoHorario = new Set(ocupados.map((ocupado) => ocupado.estagiarioId));

  return configuracoes
    .filter(({ estagiario, limitePacientes }) => (carga.get(estagiario.id) ?? 0) < limitePacientes && !ocupadosNoHorario.has(estagiario.id))
    .map(({ estagiario }) => estagiario);
}

export async function listarEstagiariosParaTransferencia(
  agendamentoId: string,
  usuario: ContextoAutorizacao,
  agora = new Date(),
): Promise<EstagiarioParaTransferencia[]> {
  const agendamento = await carregarAgendamentoAtivo(prisma, agendamentoId, usuario, PERFIS_DA_SECRETARIA);
  return estagiariosElegiveis(prisma, agendamento, agora);
}

export async function transferirAgendamento(
  agendamentoId: string,
  estagiarioId: string,
  usuario: ContextoAutorizacao,
  agora = new Date(),
): Promise<void> {
  const dados = transferenciaSchema.safeParse({ estagiarioId });
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  try {
    await executarEmTransacao((tx) => transferirNaTransacao(tx, agendamentoId, dados.data.estagiarioId, usuario, agora));
  } catch (erro) {
    if (violouUnicidade(erro)) throw new ErroDeRegra("HORARIO_OCUPADO", "O estagiário escolhido acabou de ocupar este horário. Escolha outro.");
    throw erro;
  }
}

async function transferirNaTransacao(
  tx: Transacao,
  agendamentoId: string,
  estagiarioId: string,
  usuario: ContextoAutorizacao,
  agora: Date,
): Promise<void> {
  const agendamento = await carregarAgendamentoAtivo(tx, agendamentoId, usuario, PERFIS_DA_SECRETARIA);
  if (agendamento.status !== "CONFIRMADO") {
    throw new ErroDeRegra("STATUS_INVALIDO", "Só é possível transferir um atendimento confirmado.");
  }

  const [novo] = await estagiariosElegiveis(tx, agendamento, agora, estagiarioId);
  if (!novo) throw new ErroDeRegra("SEM_VAGA", "O estagiário escolhido não está liberado, não tem vaga ou já tem paciente neste horário.");
  const anterior = await tx.usuario.findUnique({ where: { id: agendamento.estagiarioId }, select: { nome: true } });

  await tx.agendamento.update({
    where: { id: agendamentoId },
    data: {
      estagiarioId: novo.id,
      estagiarioAtivoChave: chaveEstagiario(novo.id, agendamento.diaSemana, agendamento.horaInicio),
      eventos: {
        create: {
          tipo: "TRANSFERIDO",
          usuarioId: usuario.id,
          observacao: `De ${anterior?.nome ?? "estagiário anterior"} para ${novo.nome}, ${DIAS_DA_SEMANA[agendamento.diaSemana]} às ${formatarHora(agendamento.horaInicio)}`,
        },
      },
    },
  });
}
