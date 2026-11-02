import "server-only";
import { DIAS_DA_SEMANA, filtroAgendamentoAtivo, formatarHora, horarioNaGrade } from "@/lib/agendamento/regras";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";

type NovoHorario = { unidadeId: string; diaSemana: number; horaInicio: number };

export function descreverHorario(diaSemana: number, horaInicio: number): string {
  return `${DIAS_DA_SEMANA[diaSemana]} ${formatarHora(horaInicio)}`;
}

export function unidadeDaAgenda(usuario: ContextoAutorizacao): string | null {
  return usuario.unidades[0] ?? null;
}

export async function adicionarHorarioDoEstagiario(usuario: ContextoAutorizacao, novo: NovoHorario): Promise<void> {
  await executarEmTransacao((tx) => ativarHorario(tx, usuario, novo));
}

export async function removerHorarioDoEstagiario(usuario: ContextoAutorizacao, horarioId: string): Promise<void> {
  await executarEmTransacao((tx) => desativarHorarioLivre(tx, usuario, horarioId, "remover"));
}

export async function trocarHorarioDoEstagiario(usuario: ContextoAutorizacao, horarioId: string, novo: NovoHorario): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const repetido = await tx.horarioDisponivel.findFirst({
      where: { estagiarioId: usuario.id, diaSemana: novo.diaSemana, horaInicio: novo.horaInicio, ativo: true },
      select: { id: true },
    });
    if (repetido) throw new ErroDeRegra("DADOS_INVALIDOS", "Você já tem esse horário na agenda.");

    await desativarHorarioLivre(tx, usuario, horarioId, "trocar");
    await ativarHorario(tx, usuario, novo);
  });
}

async function ativarHorario(tx: Transacao, usuario: ContextoAutorizacao, novo: NovoHorario): Promise<void> {
  const unidade = await tx.unidade.findUnique({
    where: { id: novo.unidadeId },
    select: { horaAbertura: true, horaFechamento: true, duracaoBlocoMin: true },
  });
  if (!unidade || !horarioNaGrade(unidade, novo.horaInicio)) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um dia e um horário da grade.");
  }

  const chave = { estagiarioId: usuario.id, diaSemana: novo.diaSemana, horaInicio: novo.horaInicio };
  await tx.horarioDisponivel.upsert({
    where: { estagiarioId_diaSemana_horaInicio: chave },
    create: chave,
    update: { ativo: true },
  });
}

async function desativarHorarioLivre(tx: Transacao, usuario: ContextoAutorizacao, horarioId: string, acao: "remover" | "trocar"): Promise<void> {
  const horario = await tx.horarioDisponivel.findFirst({
    where: { id: horarioId, estagiarioId: usuario.id, ativo: true },
    select: { id: true },
  });
  if (!horario) throw new ErroDeRegra("NAO_ENCONTRADO", "Horário não encontrado.");

  const ocupado = await tx.agendamento.count({ where: { ...filtroAgendamentoAtivo(new Date()), horarioAtivoId: horario.id } });
  if (ocupado > 0) {
    throw new ErroDeRegra("HORARIO_OCUPADO", `Este horário tem paciente. Cancele a reserva em Minhas reservas antes de ${acao}.`);
  }

  await tx.horarioDisponivel.update({ where: { id: horario.id }, data: { ativo: false } });
}
