import "server-only";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import {
  filtroDeUsuariosVisiveis,
  filtroDeVinculosDeEquipeGerenciaveis,
  filtroDeVinculosDeUnidadeGerenciaveis,
} from "@/lib/usuario/escopo-usuario";
import { determinarEstadoAcesso } from "@/lib/usuario/estado-acesso";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";
import { situacaoListagemUsuarioSchema } from "@/lib/usuario/situacao-listagem";
import { filtroDeSituacaoUsuario } from "@/lib/usuario/filtro-situacao-listagem";

const ITENS_POR_PAGINA = 10;

const filtrosSchema = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  busca: z.string().trim().max(120).catch(""),
  status: situacaoListagemUsuarioSchema,
});

export type FiltrosUsuarios = z.input<typeof filtrosSchema>;

export async function listarUsuarios(entrada: FiltrosUsuarios, autor: ContextoAutorizacao, agora = new Date()) {
  const filtros = filtrosSchema.parse(entrada);
  const situacao = await filtroDeSituacaoUsuario(filtros, autor, agora, ITENS_POR_PAGINA);
  const where: Prisma.UsuarioWhereInput = {
    AND: [
      filtroDeUsuariosVisiveis(autor),
      situacao.where,
    ],
    ...(filtros.busca
      ? {
          OR: [
            { nome: { contains: filtros.busca, mode: "insensitive" } },
            { email: { contains: filtros.busca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, usuarios] = await Promise.all([
    situacao.total ?? prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      skip: situacao.total === undefined ? (filtros.pagina - 1) * ITENS_POR_PAGINA : 0,
      take: ITENS_POR_PAGINA,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        accounts: {
          where: { providerId: "credential" },
          take: 1,
          select: { id: true },
        },
        convites: {
          orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
          take: 1,
          select: { expiraEm: true, usadoEm: true, revogadoEm: true },
        },
        unidades: {
          where: {
            ativo: true,
            unidade: { ativa: true },
            AND: [filtroDeVinculosDeUnidadeGerenciaveis(autor)],
          },
          orderBy: { unidade: { nome: "asc" } },
          select: { unidade: { select: { nome: true } } },
        },
        equipes: {
          where: {
            ativo: true,
            vinculoUnidade: { ativo: true },
            equipe: { ativa: true },
            AND: [filtroDeVinculosDeEquipeGerenciaveis(autor)],
          },
          orderBy: { equipe: { nome: "asc" } },
          select: { equipe: { select: { nome: true, supervisorId: true } } },
        },
      },
    }),
  ]);
  const perfisGerenciados = perfisCriadosPor(autor.perfil);

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
      estadoAcesso: determinarEstadoAcesso(usuario, agora),
      podeGerenciar: perfisGerenciados.some((perfil) => perfil === usuario.perfil),
      unidades: usuario.unidades.map(({ unidade }) => unidade.nome),
      equipes: usuario.equipes.map(({ equipe }) =>
        usuario.perfil === "ESTAGIARIO" && equipe.supervisorId === null
          ? `${equipe.nome} — Sem supervisor`
          : equipe.nome,
      ),
    })),
  };
}
