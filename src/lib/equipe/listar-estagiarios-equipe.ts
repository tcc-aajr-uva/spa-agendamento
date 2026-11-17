import "server-only";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroDeUsuariosGerenciaveis } from "@/lib/usuario/escopo-usuario";
import { determinarEstadoAcesso } from "@/lib/usuario/estado-acesso";
import { consultarEquipe } from "./consultar-equipe";
import { podeConsultarEstagiariosDaEquipe } from "./escopo-equipe";

const ITENS_POR_PAGINA = 10;
const filtrosSchema = z.object({
  busca: z.string().trim().max(120).catch(""),
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
});

export async function listarEstagiariosDaEquipe(
  equipeId: string,
  entrada: z.input<typeof filtrosSchema>,
  autor: ContextoAutorizacao,
  agora = new Date(),
) {
  if (!podeConsultarEstagiariosDaEquipe(autor)) return null;
  const equipe = await consultarEquipe(equipeId, autor);
  if (!equipe) return null;

  const filtros = filtrosSchema.parse(entrada);
  const where: Prisma.UsuarioWhereInput = {
    perfil: "ESTAGIARIO",
    // A vigência pertence ao vínculo, independentemente do acesso da conta.
    equipes: { some: { equipeId: equipe.id, ativo: true, vinculoUnidade: { ativo: true } } },
    ...(filtros.busca ? {
      OR: [
        { nome: { contains: filtros.busca, mode: "insensitive" } },
        { email: { contains: filtros.busca, mode: "insensitive" } },
      ],
    } : {}),
  };
  const total = await prisma.usuario.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const usuarios = await prisma.usuario.findMany({
    where,
    orderBy: [{ nome: "asc" }, { id: "asc" }],
    skip: (pagina - 1) * ITENS_POR_PAGINA,
    take: ITENS_POR_PAGINA,
    select: {
      id: true, nome: true, email: true, ativo: true,
      accounts: { where: { providerId: "credential" }, take: 1, select: { id: true } },
      convites: {
        orderBy: [{ criadoEm: "desc" }, { id: "desc" }], take: 1,
        select: { expiraEm: true, usadoEm: true, revogadoEm: true },
      },
    },
  });
  const gerenciaveis = usuarios.length > 0 ? await prisma.usuario.findMany({
    where: { id: { in: usuarios.map(({ id }) => id) }, AND: [filtroDeUsuariosGerenciaveis(autor)] },
    select: { id: true },
  }) : [];
  const idsGerenciaveis = new Set(gerenciaveis.map(({ id }) => id));

  return {
    equipe, busca: filtros.busca, pagina, total, totalPaginas,
    estagiarios: usuarios.map((usuario) => ({
      id: usuario.id, nome: usuario.nome, email: usuario.email,
      estadoAcesso: determinarEstadoAcesso(usuario, agora),
      podeAbrirCadastro: idsGerenciaveis.has(usuario.id),
    })),
  };
}
