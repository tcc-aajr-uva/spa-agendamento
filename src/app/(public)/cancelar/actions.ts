"use server";

import { z } from "zod";
import { cancelarPorCpf, cancelarPorToken } from "@/lib/agendamento/cancelar";
import { ErroDeRegra } from "@/lib/erros";
import { consumirLimiteDoCliente } from "@/lib/limite-requisicao";
import { cpfValido, somenteDigitos } from "@/lib/paciente/dados-paciente";
import { TAMANHO_CODIGO, TAMANHO_TOKEN } from "@/lib/token-constantes";

const codigoSchema = z.string().trim().toUpperCase().length(TAMANHO_CODIGO);

const porTokenSchema = z.object({ token: z.string().length(TAMANHO_TOKEN), codigo: codigoSchema });

const porCpfSchema = z.object({ cpf: z.string().transform(somenteDigitos).refine(cpfValido), codigo: codigoSchema });

export type EstadoCancelamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

export async function cancelarAgendamentoAction(
  _anterior: EstadoCancelamento,
  formData: FormData,
): Promise<EstadoCancelamento> {
  const dados = porTokenSchema.safeParse({ token: formData.get("token"), codigo: formData.get("codigo") });
  if (!dados.success) return erro("Confira o código de 6 caracteres e tente de novo.");
  return executar(() => cancelarPorToken(dados.data.token, dados.data.codigo));
}

export async function cancelarPorCpfAction(_anterior: EstadoCancelamento, formData: FormData): Promise<EstadoCancelamento> {
  const dados = porCpfSchema.safeParse({ cpf: formData.get("cpf"), codigo: formData.get("codigo") });
  if (!dados.success) return erro("Confira o CPF e o código de 6 caracteres e tente de novo.");
  return executar(() => cancelarPorCpf(dados.data.cpf, dados.data.codigo));
}

function erro(mensagem: string): EstadoCancelamento {
  return { status: "erro", mensagem };
}

async function executar(cancelar: () => Promise<void>): Promise<EstadoCancelamento> {
  try {
    await consumirLimiteDoCliente({ escopo: "cancelamento-publico", janelaMs: 10 * 60_000, maximo: 10 });
    await cancelar();
    return { status: "sucesso" };
  } catch (falha) {
    if (falha instanceof ErroDeRegra) return erro(falha.message);
    console.error(falha);
    return erro("Não foi possível cancelar agora. Tente novamente.");
  }
}
