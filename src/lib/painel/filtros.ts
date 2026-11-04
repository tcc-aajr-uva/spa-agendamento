import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { HORAS_PERTO_DE_VENCER } from "./configuracao";

const UMA_HORA_MS = 60 * 60 * 1000;

export function filtroPendentesPertoDeVencer(usuario: ContextoAutorizacao, agora: Date): Prisma.AgendamentoWhereInput {
  const limite = new Date(agora.getTime() + HORAS_PERTO_DE_VENCER * UMA_HORA_MS);
  return {
    ...filtroDeUnidades(usuario),
    status: "PENDENTE",
    horarioAtivoId: { not: null },
    prazoConfirmacao: { gt: agora, lte: limite },
  };
}