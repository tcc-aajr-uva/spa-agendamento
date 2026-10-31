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
    const registro = await tx.limiteRequisicao.upsert({
      where: { key: chave },
      create: { key: chave, count: 0, lastRequest: instante },
      update: {},
      select: { count: true, lastRequest: true },
    });

    if (registro.lastRequest <= inicioDaJanela) {
      await tx.limiteRequisicao.update({
        where: { key: chave },
        data: { count: 1, lastRequest: instante },
      });
      return;
    }

    if (registro.count >= opcoes.maximo) {
      throw new ErroDeRegra("LIMITE_REQUISICOES", "Muitas tentativas. Aguarde um minuto e tente novamente.");
    }

    await tx.limiteRequisicao.update({
      where: { key: chave },
      data: { count: { increment: 1 }, lastRequest: instante },
    });
  });
}
