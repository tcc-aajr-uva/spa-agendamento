import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroDeUnidadesGerenciaveis } from "@/lib/unidade/escopo-unidade";

export async function consultarUnidadeGerenciavel(id: string, autor: ContextoAutorizacao) {
  return prisma.unidade.findFirst({
    where: { id, AND: [filtroDeUnidadesGerenciaveis(autor)] },
    select: {
      id: true,
      nome: true,
      ativa: true,
      permitePaciente: true,
      permiteEstagiario: true,
      permiteSecretaria: true,
      agendamentoAberto: true,
      horaAbertura: true,
      horaFechamento: true,
      duracaoBlocoMin: true,
      atualizadoEm: true,
    },
  });
}
