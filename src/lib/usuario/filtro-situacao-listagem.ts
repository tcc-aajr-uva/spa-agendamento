import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SituacaoListagemUsuario } from "./situacao-listagem";

export async function filtroDeSituacaoUsuario(
  situacao: SituacaoListagemUsuario,
  agora: Date,
): Promise<Prisma.UsuarioWhereInput> {
  if (situacao === "TODOS") return {};
  if (situacao === "ATIVOS") {
    return { ativo: true, accounts: { some: { providerId: "credential" } } };
  }
  if (situacao === "INATIVOS") return { ativo: false };

  const convites = await prisma.$queryRaw<{ id: string }[]>`
    SELECT ultimo.id
    FROM (
      SELECT DISTINCT ON ("usuarioId")
        id, "usuarioId", "revogadoEm", "usadoEm", "expiraEm"
      FROM "Convite"
      ORDER BY "usuarioId", "criadoEm" DESC, id DESC
    ) AS ultimo
    WHERE CASE
      WHEN ultimo."revogadoEm" IS NOT NULL THEN 'CONVITE_REVOGADO'
      WHEN ultimo."usadoEm" IS NOT NULL THEN 'SEM_CONVITE'
      WHEN ultimo."expiraEm" <= ${agora} THEN 'CONVITE_EXPIRADO'
      ELSE 'CONVITE_PENDENTE'
    END = ${situacao}
  `;

  const conviteMaisRecente = { some: { id: { in: convites.map(({ id }) => id) } } };
  return {
    ativo: true,
    accounts: { none: { providerId: "credential" } },
    ...(situacao === "SEM_CONVITE"
      ? { OR: [{ convites: { none: {} } }, { convites: conviteMaisRecente }] }
      : { convites: conviteMaisRecente }),
  };
}
