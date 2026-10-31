import "server-only";
import { filtroAgendamentoAtivo, horarioNaGrade } from "@/lib/agendamento/regras";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao } from "@/lib/transacao";

export async function adicionarHorarioDoEstagiario(
  usuario: ContextoAutorizacao,
  unidadeId: string,
  diaSemana: number,
  horaInicio: number,
): Promise<void> {
  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: { horaAbertura: true, horaFechamento: true, duracaoBlocoMin: true },
  });
  if (!unidade || !horarioNaGrade(unidade, horaInicio)) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um dia e um horário da grade.");
  }

  await prisma.horarioDisponivel.upsert({
    where: { estagiarioId_diaSemana_horaInicio: { estagiarioId: usuario.id, diaSemana, horaInicio } },
    create: { estagiarioId: usuario.id, diaSemana, horaInicio },
    update: { ativo: true },
  });
}

export async function removerHorarioDoEstagiario(usuario: ContextoAutorizacao, horarioId: string): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const horario = await tx.horarioDisponivel.findFirst({
      where: { id: horarioId, estagiarioId: usuario.id, ativo: true },
      select: { id: true },
    });
    if (!horario) throw new ErroDeRegra("NAO_ENCONTRADO", "Horário não encontrado.");

    const ocupado = await tx.agendamento.count({ where: { ...filtroAgendamentoAtivo(new Date()), horarioAtivoId: horario.id } });
    if (ocupado > 0) {
      throw new ErroDeRegra("HORARIO_OCUPADO", "Este horário tem paciente. Cancele a reserva em Minhas reservas antes de remover.");
    }

    await tx.horarioDisponivel.update({ where: { id: horario.id }, data: { ativo: false } });
  });
}
