"use server";

import { refresh } from "next/cache";
import { adicionarHorarioDoEstagiario, removerHorarioDoEstagiario } from "@/lib/agenda/horarios";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { DIAS_EXIBIDOS } from "../salas/ocupacao-salas";
import { perfisDaRota } from "../menu";

export type EstadoAgenda = { erro?: string; mensagem?: string };

export async function adicionarHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const unidadeId = usuario.unidades[0];
  if (!unidadeId) return { erro: "Seu cadastro não tem unidade." };
  const diaSemana = Number(formData.get("diaSemana"));
  const horaInicio = Number(formData.get("horaInicio"));
  if (!DIAS_EXIBIDOS.includes(diaSemana)) return { erro: "Escolha um dia e um horário da grade." };

  return tratarErros(async () => {
    await adicionarHorarioDoEstagiario(usuario, unidadeId, diaSemana, horaInicio);
    return { mensagem: `${DIAS_DA_SEMANA[diaSemana]} ${formatarHora(horaInicio)} adicionado.` };
  });
}

export async function removerHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  return tratarErros(async () => {
    await removerHorarioDoEstagiario(usuario, String(formData.get("horarioId") ?? ""));
    return {};
  });
}

async function tratarErros(operacao: () => Promise<EstadoAgenda>): Promise<EstadoAgenda> {
  try {
    const estado = await operacao();
    refresh();
    return estado;
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}
