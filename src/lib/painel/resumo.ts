import "server-only";

import { filtroAgendamentoAtivo } from "@/lib/agendamento/regras";
import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroPendentesPertoDeVencer } from "./filtros";

export async function obterResumoDoPainel(usuario: ContextoAutorizacao, agora: Date) {
  const unidades = filtroDeUnidades(usuario);

  const [porStatus, pertoDeVencer, naListaDeEspera] = await Promise.all([
    prisma.agendamento.groupBy({
      by: ["status"],
      where: { ...unidades, ...filtroAgendamentoAtivo(agora) },
      _count: { _all: true },
    }),
    prisma.agendamento.count({ where: filtroPendentesPertoDeVencer(usuario, agora) }),
    prisma.listaEspera.count({ where: { ...unidades, status: "AGUARDANDO" } }),
  ]);

  const contar = (status: string) => porStatus.find((linha) => linha.status === status)?._count._all ?? 0;

  return {
    pendentes: contar("PENDENTE"),
    pertoDeVencer,
    confirmados: contar("CONFIRMADO"),
    emAtendimento: contar("EM_ATENDIMENTO"),
    naListaDeEspera,
  };
}