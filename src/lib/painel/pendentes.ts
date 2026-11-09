import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroPendentesPertoDeVencer } from "./filtros";

const LIMITE_DA_LISTA = 10;

export async function listarPendentesPertoDeVencer(usuario: ContextoAutorizacao, agora: Date) {
  return prisma.agendamento.findMany({
    where: filtroPendentesPertoDeVencer(usuario, agora),
    orderBy: { prazoConfirmacao: "asc" },
    take: LIMITE_DA_LISTA,
    select: {
      id: true,
      diaSemana: true,
      horaInicio: true,
      prazoConfirmacao: true,
      paciente: { select: { nome: true } },
      sala: { select: { nome: true } },
    },
  });
}