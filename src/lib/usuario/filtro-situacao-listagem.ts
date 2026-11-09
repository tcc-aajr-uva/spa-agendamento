import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { filtroSqlDeUsuariosVisiveis } from "./escopo-usuario";
import type { SituacaoListagemUsuario } from "./situacao-listagem";

type Filtros = {
  status: SituacaoListagemUsuario;
  busca: string;
  pagina: number;
};

type ResultadoFiltro = {
  where: Prisma.UsuarioWhereInput;
  total?: number;
};

export async function filtroDeSituacaoUsuario(
  filtros: Filtros,
  autor: ContextoAutorizacao,
  agora: Date,
  itensPorPagina: number,
): Promise<ResultadoFiltro> {
  if (filtros.status === "TODOS") return { where: {} };
  if (filtros.status === "ATIVOS") {
    return { where: { ativo: true, accounts: { some: { providerId: "credential" } } } };
  }
  if (filtros.status === "INATIVOS") return { where: { ativo: false } };

  const busca = filtros.busca
    ? Prisma.sql`AND (u.nome ILIKE ${"%" + filtros.busca + "%"} OR u.email ILIKE ${"%" + filtros.busca + "%"})`
    : Prisma.empty;
  const [resultado] = await prisma.$queryRaw<{ total: number; ids: string[] }[]>(Prisma.sql`
    WITH visiveis AS MATERIALIZED (
      SELECT u.id, u.nome FROM "Usuario" u
      WHERE u.ativo AND (${filtroSqlDeUsuariosVisiveis(autor)}) ${busca}
        AND NOT EXISTS (
          SELECT 1 FROM "ContaAutenticacao" conta
          WHERE conta."userId" = u.id AND conta."providerId" = 'credential'
        )
    ), filtrados AS MATERIALIZED (
      SELECT u.id, u.nome FROM visiveis u
      LEFT JOIN LATERAL (
        SELECT c.id, c."revogadoEm", c."usadoEm", c."expiraEm"
        FROM "Convite" c WHERE c."usuarioId" = u.id
        ORDER BY c."criadoEm" DESC, c.id DESC LIMIT 1
      ) ultimo ON TRUE
      WHERE CASE
        WHEN ultimo.id IS NULL THEN 'SEM_CONVITE'
        WHEN ultimo."revogadoEm" IS NOT NULL THEN 'CONVITE_REVOGADO'
        WHEN ultimo."usadoEm" IS NOT NULL THEN 'SEM_CONVITE'
        WHEN ultimo."expiraEm" <= ${agora} THEN 'CONVITE_EXPIRADO'
        ELSE 'CONVITE_PENDENTE'
      END = ${filtros.status}
    )
    SELECT COUNT(*)::integer AS total, ARRAY(
      SELECT id FROM filtrados ORDER BY nome, id
      LIMIT ${itensPorPagina} OFFSET ${(filtros.pagina - 1) * itensPorPagina}
    ) AS ids FROM filtrados
  `);

  return { where: { id: { in: resultado.ids } }, total: resultado.total };
}
