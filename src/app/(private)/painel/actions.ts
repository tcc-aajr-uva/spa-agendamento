"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { liberarAgendamento } from "@/lib/agendamento/liberar-agendamento";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";

export type EstadoAcao = { erro: string | null };

const entradaSchema = z.object({ agendamentoId: z.string().min(1) });

export async function liberarPendente(_estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(["SECRETARIA", "COORDENACAO", "ADMINISTRADOR"]);

  const entrada = entradaSchema.safeParse({ agendamentoId: formData.get("agendamentoId") });
  if (!entrada.success) return { erro: "Agendamento inválido." };
  const { agendamentoId } = entrada.data;

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { unidadeId: true, equipeId: true, status: true },
  });
  if (!agendamento || !podeAcessar(usuario, { unidadeId: agendamento.unidadeId, equipeId: agendamento.equipeId })) {
    return { erro: "Agendamento não encontrado." };
  }
  if (agendamento.status !== "PENDENTE") return { erro: "Só é possível liberar agendamentos pendentes." };

  try {
    await liberarAgendamento(agendamentoId, { status: "CANCELADO", motivo: "NAO_CONFIRMADO", usuarioId: usuario.id });
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }

  revalidatePath("/painel");
  return { erro: null };
}