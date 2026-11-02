import "server-only";

import { prisma } from "@/lib/prisma";
import { hashToken, tokenTemFormatoValido } from "@/lib/token";

export type EstadoConvite = "VALIDO" | "USADO" | "EXPIRADO" | "INDISPONIVEL";

export async function consultarEstadoConvite(token: string, agora: Date): Promise<EstadoConvite> {
  if (!tokenTemFormatoValido(token)) return "INDISPONIVEL";

  const convite = await prisma.convite.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiraEm: true,
      usadoEm: true,
      revogadoEm: true,
      usuario: { select: { ativo: true } },
    },
  });

  if (!convite || !convite.usuario.ativo || convite.revogadoEm !== null) return "INDISPONIVEL";
  if (convite.usadoEm !== null) return "USADO";
  if (convite.expiraEm <= agora) return "EXPIRADO";
  return "VALIDO";
}
