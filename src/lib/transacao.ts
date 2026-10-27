import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroDeRegra } from "@/lib/erros";

export type Transacao = Prisma.TransactionClient;

const TENTATIVAS = 3;

export async function executarEmTransacao<T>(operacao: (tx: Transacao) => Promise<T>): Promise<T> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await prisma.$transaction(operacao, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (erro) {
      if (erroDeConcorrencia(erro) && tentativa < TENTATIVAS) continue;
      if (erroDeConcorrencia(erro)) {
        throw new ErroDeRegra("CONFLITO_CONCORRENTE", "Outra pessoa alterou estes dados ao mesmo tempo. Tente novamente.");
      }
      throw erro;
    }
  }
}

export function violouUnicidade(erro: unknown, campo?: string): boolean {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") return false;
  if (!campo) return true;
  return JSON.stringify(erro.meta ?? {}).includes(campo);
}

function erroDeConcorrencia(erro: unknown): boolean {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034";
}
