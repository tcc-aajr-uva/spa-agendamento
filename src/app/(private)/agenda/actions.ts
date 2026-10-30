"use server";

import { refresh } from "next/cache";
import { DIAS_DA_SEMANA, filtroAgendamentoAtivo, formatarHora, horarioNaGrade } from "@/lib/agendamento/regras";
import { exigirUsuario } from "@/lib/auth/permissao";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao } from "@/lib/transacao";
import { perfisDaRota } from "../menu";

export type EstadoAgenda = { erro?: string; mensagem?: string };

export async function adicionarHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  if (!usuario.unidadeId) return { erro: "Seu cadastro não tem unidade." };
  const diaSemana = Number(formData.get("diaSemana"));
  const horaInicio = Number(formData.get("horaInicio"));

  const unidade = await prisma.unidade.findUnique({
    where: { id: usuario.unidadeId },
    select: { horaAbertura: true, horaFechamento: true, duracaoBlocoMin: true },
  });
  if (!unidade || !Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 6 || !horarioNaGrade(unidade, horaInicio)) {
    return { erro: "Escolha um dia e um horário da grade." };
  }

  // Reativa se o mesmo dia e hora já existiram, para manter o histórico ligado a ele.
  await prisma.horarioDisponivel.upsert({
    where: { estagiarioId_diaSemana_horaInicio: { estagiarioId: usuario.id, diaSemana, horaInicio } },
    create: { estagiarioId: usuario.id, diaSemana, horaInicio },
    update: { ativo: true },
  });
  refresh();
  return { mensagem: `${DIAS_DA_SEMANA[diaSemana]} ${formatarHora(horaInicio)} adicionado.` };
}

export async function removerHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const horarioId = String(formData.get("horarioId") ?? "");

  try {
    const erro = await executarEmTransacao(async (tx) => {
      const horario = await tx.horarioDisponivel.findFirst({
        where: { id: horarioId, estagiarioId: usuario.id, ativo: true },
        select: { id: true },
      });
      if (!horario) return "Horário não encontrado.";

      // Na mesma transação Serializable do criarAgendamento: um paciente novo neste horário não escapa.
      const ocupado = await tx.agendamento.count({ where: { ...filtroAgendamentoAtivo(new Date()), horarioAtivoId: horario.id } });
      if (ocupado > 0) return "Este horário tem paciente. Cancele a reserva em Minhas reservas antes de remover.";

      // Desativa em vez de apagar: agendamentos antigos continuam apontando para ele.
      await tx.horarioDisponivel.update({ where: { id: horario.id }, data: { ativo: false } });
      return null;
    });
    if (erro) return { erro };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  refresh();
  return {};
}
