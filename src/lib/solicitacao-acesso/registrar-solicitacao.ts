import "server-only";

import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";
import { novaSolicitacaoSchema, type NovaSolicitacao } from "@/lib/solicitacao-acesso/dados-solicitacao";

export async function registrarSolicitacao(entrada: NovaSolicitacao): Promise<void> {
  const resultado = novaSolicitacaoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const { nome, email, unidadeId } = resultado.data;

  try {
    await executarEmTransacao(async (tx) => {
      const unidade = await tx.unidade.findFirst({
        where: { id: unidadeId, ativa: true },
        select: { id: true },
      });
      if (!unidade) {
        throw new ErroDeRegra("DADOS_INVALIDOS", "Selecione uma unidade disponível.");
      }

      const usuario = await tx.usuario.findUnique({ where: { email }, select: { id: true } });
      if (usuario) return;

      await tx.solicitacaoAcesso.create({
        data: { nome, email, emailPendente: email, unidadeId },
        select: { id: true },
      });
    });
  } catch (erro) {
    if (violouUnicidade(erro, "emailPendente")) return;
    throw erro;
  }
}
