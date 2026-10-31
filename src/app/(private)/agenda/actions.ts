"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  adicionarHorarioDoEstagiario,
  descreverHorario,
  removerHorarioDoEstagiario,
  trocarHorarioDoEstagiario,
  unidadeDaAgenda,
} from "@/lib/agenda/horarios";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
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
const horarioIdSchema = z.string().min(1, "Horário não encontrado.");

export async function adicionarHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const novo = lerNovoHorario(usuario, formData);
  if ("erro" in novo) return novo;

  return tratarErros(async () => {
    await adicionarHorarioDoEstagiario(usuario, novo);
    return { mensagem: `${descreverHorario(novo.diaSemana, novo.horaInicio)} adicionado.` };
  });
}

export async function trocarHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const horarioId = horarioIdSchema.safeParse(String(formData.get("horarioId") ?? ""));
  if (!horarioId.success) return { erro: horarioId.error.issues[0].message };
  const novo = lerNovoHorario(usuario, formData);
  if ("erro" in novo) return novo;

  return tratarErros(async () => {
    await trocarHorarioDoEstagiario(usuario, horarioId.data, novo);
    return { mensagem: `Trocado para ${descreverHorario(novo.diaSemana, novo.horaInicio)}.` };
  });
}

export async function removerHorario(_estado: EstadoAgenda, formData: FormData): Promise<EstadoAgenda> {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const horarioId = horarioIdSchema.safeParse(String(formData.get("horarioId") ?? ""));
  if (!horarioId.success) return { erro: horarioId.error.issues[0].message };
  return tratarErros(async () => {
    await removerHorarioDoEstagiario(usuario, horarioId.data);
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

function lerNovoHorario(usuario: ContextoAutorizacao, formData: FormData) {
  const unidadeId = unidadeDaAgenda(usuario);
  if (!unidadeId) return { erro: "Seu cadastro não tem unidade." };
  const dados = novoHorarioSchema.safeParse({
    diaSemana: String(formData.get("diaSemana") ?? ""),
    horaInicio: String(formData.get("horaInicio") ?? ""),
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };
  return { unidadeId, ...dados.data };
}
