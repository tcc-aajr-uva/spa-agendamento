import "server-only";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroDeUnidadesGerenciaveis, podeCriarUnidade } from "@/lib/unidade/escopo-unidade";

const ITENS_POR_PAGINA = 20;

const filtrosSchema = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  busca: z.string().trim().max(120).catch(""),
  status: z.enum(["ATIVAS", "INATIVAS", "TODAS"]).catch("ATIVAS"),
});

export type FiltrosUnidades = z.input<typeof filtrosSchema>;

export async function listarUnidades(entrada: FiltrosUnidades, autor: ContextoAutorizacao) {
  const filtrosInformados = filtrosSchema.parse(entrada);
  const status = autor.perfil === "ADMINISTRADOR" ? filtrosInformados.status : "ATIVAS";
  const where: Prisma.UnidadeWhereInput = {
    ...filtroDeUnidadesGerenciaveis(autor),
    ...(status === "ATIVAS" ? { ativa: true } : {}),
    ...(status === "INATIVAS" ? { ativa: false } : {}),
    ...(filtrosInformados.busca
      ? { nome: { contains: filtrosInformados.busca, mode: "insensitive" } }
      : {}),
  };

  const [total, unidades] = await Promise.all([
    prisma.unidade.count({ where }),
    prisma.unidade.findMany({
      where,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      skip: (filtrosInformados.pagina - 1) * ITENS_POR_PAGINA,
      take: ITENS_POR_PAGINA,
      select: {
        id: true,
        nome: true,
        ativa: true,
        agendamentoAberto: true,
        permitePaciente: true,
        permiteEstagiario: true,
        permiteSecretaria: true,
      },
    }),
  ]);

  return {
    busca: filtrosInformados.busca,
    status,
    pagina: filtrosInformados.pagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)),
    podeCriar: podeCriarUnidade(autor),
    podeFiltrarInativas: autor.perfil === "ADMINISTRADOR",
    unidades,
  };
}
