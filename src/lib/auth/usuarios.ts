import "server-only";

import { prisma } from "@/lib/prisma";

export async function desativarUsuario(usuarioId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const resultado = await tx.usuario.updateMany({
      where: { id: usuarioId, ativo: true },
      data: { ativo: false },
    });

    await tx.sessaoAutenticacao.deleteMany({
      where: { userId: usuarioId },
    });

    return resultado.count > 0;
  });
}
