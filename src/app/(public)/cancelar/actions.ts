"use server";

import { z } from "zod";
import { cancelarPorToken } from "@/lib/agendamento/cancelar";
import { ErroDeRegra } from "@/lib/erros";
import { consumirLimiteDoCliente } from "@/lib/limite-requisicao";
import { TAMANHO_CODIGO, TAMANHO_TOKEN } from "@/lib/token-constantes";

const cancelamentoSchema = z.object({
  token: z.string().length(TAMANHO_TOKEN),
  codigo: z.string().trim().toUpperCase().length(TAMANHO_CODIGO),
});

export type EstadoCancelamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

export async function cancelarAgendamentoAction(
  _anterior: EstadoCancelamento,
  formData: FormData,
): Promise<EstadoCancelamento> {
  const dados = cancelamentoSchema.safeParse({
    token: formData.get("token"),
    codigo: formData.get("codigo"),
  });
  if (!dados.success) {
    return { status: "erro", mensagem: "Confira o código de 6 caracteres e tente de novo." };
  }

  try {
    await consumirLimiteDoCliente({ escopo: "cancelamento-publico", janelaMs: 10 * 60_000, maximo: 10 });
    await cancelarPorToken(dados.data.token, dados.data.codigo);
    return { status: "sucesso" };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
    console.error(erro);
    return { status: "erro", mensagem: "Não foi possível cancelar agora. Tente novamente." };
  }
}