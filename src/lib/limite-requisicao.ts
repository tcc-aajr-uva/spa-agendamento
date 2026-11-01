import "server-only";

import { ErroDeRegra } from "@/lib/erros";
import { hashToken } from "@/lib/token";
import { executarEmTransacao } from "@/lib/transacao";

type OpcoesLimite = {
  escopo: string;
  identificador: string;
  janelaMs: number;
  maximo: number;
};

export async function consumirLimiteRequisicoes(opcoes: OpcoesLimite, agora = new Date()): Promise<void> {
  const chave = `${opcoes.escopo}:${hashToken(opcoes.identificador)}`;
  const instante = BigInt(agora.getTime());
  const inicioDaJanela = instante - BigInt(opcoes.janelaMs);

  await executarEmTransacao(async (tx) => {
    await tx.limiteRequisicao.upsert({
      where: { key: chave },
      create: { key: chave, count: 0, lastRequest: instante },
      update: {},
      select: { id: true },
    });

    const reinicio = await tx.limiteRequisicao.updateMany({
      where: { key: chave, lastRequest: { lte: inicioDaJanela } },
      data: { count: 1, lastRequest: instante },
    });
    if (reinicio.count === 1) return;

    const consumo = await tx.limiteRequisicao.updateMany({
      where: {
        key: chave,
        lastRequest: { gt: inicioDaJanela },
        count: { lt: opcoes.maximo },
      },
      data: { count: { increment: 1 }, lastRequest: instante },
    });
    if (consumo.count === 1) return;

    throw new ErroDeRegra("LIMITE_REQUISICOES", "Muitas tentativas. Aguarde um minuto e tente novamente.");
  });
}
