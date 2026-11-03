import "server-only";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { hojeNoBrasil } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { dataDoPeriodo, situacaoDoPeriodo, situacaoPeriodoSchema } from "./dados-periodo";
import { filtroDeUnidadesDosPeriodos } from "./escopo-periodo";

const ITENS_POR_PAGINA = 20;

const paginaSchema = z.coerce.number().int().min(1).max(1_000_000).catch(1);
const filtrosSchema = z.object({ pagina: paginaSchema, situacao: situacaoPeriodoSchema.catch("TODOS") });

export async function listarPeriodos(unidadeId: string, entrada: z.input<typeof filtrosSchema>, autor: ContextoAutorizacao) {
  const filtros = filtrosSchema.parse(entrada);
  const hoje = hojeNoBrasil(new Date());
  const porSituacao: Prisma.PeriodoLetivoWhereInput = filtros.situacao === "FUTURO" ? { inicio: { gt: hoje } }
    : filtros.situacao === "ENCERRADO" ? { fim: { lt: hoje } }
    : filtros.situacao === "EM_ANDAMENTO" ? { inicio: { lte: hoje }, fim: { gte: hoje } } : {};
  const where: Prisma.PeriodoLetivoWhereInput = { unidadeId, unidade: filtroDeUnidadesDosPeriodos(autor), ...porSituacao };
  const total = await prisma.periodoLetivo.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const periodos = await prisma.periodoLetivo.findMany({
    where, skip: (pagina - 1) * ITENS_POR_PAGINA, take: ITENS_POR_PAGINA,
    orderBy: [{ inicio: "desc" }, { id: "asc" }], select: { id: true, inicio: true, fim: true },
  });
  return {
    ...filtros, pagina, total, totalPaginas,
    periodos: periodos.map((periodo) => {
      const datas = { inicio: dataDoPeriodo(periodo.inicio), fim: dataDoPeriodo(periodo.fim) };
      return { id: periodo.id, ...datas, situacao: situacaoDoPeriodo(datas, dataDoPeriodo(hoje)) };
    }),
  };
}

export async function listarUnidadesDosPeriodos(paginaInformada: unknown, autor: ContextoAutorizacao) {
  const where = filtroDeUnidadesDosPeriodos(autor);
  const total = await prisma.unidade.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA));
  const pagina = Math.min(paginaSchema.parse(paginaInformada), totalPaginas);
  const unidades = await prisma.unidade.findMany({
    where, skip: (pagina - 1) * ITENS_POR_PAGINA, take: ITENS_POR_PAGINA, orderBy: [{ nome: "asc" }, { id: "asc" }], select: { id: true, nome: true, ativa: true },
  });
  return { unidades, pagina, totalPaginas };
}
