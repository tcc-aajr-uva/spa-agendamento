import "server-only";

import { z } from "zod";

import type { Perfil, Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";

const ITENS_POR_PAGINA = 20;

const filtrosSchema = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  busca: z.string().trim().max(120).catch(""),
  status: z.enum(["ATIVOS", "INATIVOS", "TODOS"]).catch("ATIVOS"),
});

export type FiltrosUsuarios = z.input<typeof filtrosSchema>;

export async function listarUsuarios(entrada: FiltrosUsuarios, autor: ContextoAutorizacao) {
  const filtros = filtrosSchema.parse(entrada);
  const where: Prisma.UsuarioWhereInput = {
    ...filtroDeEscopo(autor),
    ...(filtros.status === "ATIVOS" ? { ativo: true } : {}),
    ...(filtros.status === "INATIVOS" ? { ativo: false } : {}),
    ...(filtros.busca
      ? {
          OR: [
            { nome: { contains: filtros.busca, mode: "insensitive" } },
            { email: { contains: filtros.busca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, usuarios] = await prisma.$transaction([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      skip: (filtros.pagina - 1) * ITENS_POR_PAGINA,
      take: ITENS_POR_PAGINA,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        unidades: {
          where: { ativo: true, unidade: { ativa: true } },
          orderBy: { unidade: { nome: "asc" } },
          select: { unidade: { select: { nome: true } } },
        },
        equipes: {
          where: { ativo: true, vinculoUnidade: { ativo: true }, equipe: { ativa: true } },
          orderBy: { equipe: { nome: "asc" } },
          select: { equipe: { select: { nome: true } } },
        },
      },
    }),
  ]);

  return {
    pagina: filtros.pagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)),
    usuarios: usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      unidades: usuario.unidades.map(({ unidade }) => unidade.nome),
      equipes: usuario.equipes.map(({ equipe }) => equipe.nome),
    })),
  };
}

function filtroDeEscopo(autor: ContextoAutorizacao): Prisma.UsuarioWhereInput {
  if (autor.perfil === "ADMINISTRADOR") return {};

  const perfisGerenciados = perfisCriadosPor(autor.perfil);
  if (perfisGerenciados.length === 0) return { id: { in: [] } };

  if (autor.perfil === "SUPERVISOR") {
    return {
      perfil: { in: [...perfisGerenciados] },
      equipes: {
        some: {
          ativo: true,
          vinculoUnidade: { ativo: true },
          equipeId: { in: autor.equipes },
          equipe: { ativa: true, supervisorId: autor.id },
        },
      },
    };
  }

  return {
    perfil: { in: [...perfisGerenciados] as Perfil[] },
    unidades: {
      some: {
        ativo: true,
        unidadeId: { in: autor.unidades },
        unidade: { ativa: true },
      },
    },
  };
}
