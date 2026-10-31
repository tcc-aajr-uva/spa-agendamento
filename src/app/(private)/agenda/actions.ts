"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adicionarHorarioDoEstagiario, removerHorarioDoEstagiario, unidadeDaAgenda } from "@/lib/agenda/horarios";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { DIAS_EXIBIDOS } from "../salas/ocupacao-salas";
import { perfisDaRota } from "../menu";

export type EstadoAgenda = { erro?: string; mensagem?: string };

const ERRO_GRADE = "Escolha um dia e um horário da grade.";
const inteiro = z.string().regex(/^\d+$/, ERRO_GRADE).transform(Number);
const novoHorarioSchema = z.object({
  diaSemana: inteiro.refine((dia) => DIAS_EXIBIDOS.includes(dia), ERRO_GRADE),
  horaInicio: inteiro,
});

export async function adicionarHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const unidadeId = unidadeDaAgenda(usuario);
  if (!unidadeId) return { erro: "Seu cadastro não tem unidade." };
  const dados = novoHorarioSchema.safeParse({
    diaSemana: String(formData.get("diaSemana") ?? ""),
    horaInicio: String(formData.get("horaInicio") ?? ""),
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { diaSemana, horaInicio } = dados.data;

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
