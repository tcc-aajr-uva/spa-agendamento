"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { unidadeIdSchema } from "@/lib/unidade/dados-unidade";
import { PERFIS_UNIDADES } from "@/lib/unidade/escopo-unidade";
import {
  VersaoDesatualizadaDaUnidade,
  alterarAtivacaoUnidade,
  atualizarUnidade as salvarAtualizacaoUnidade,
  criarUnidade as salvarNovaUnidade,
} from "@/lib/unidade/salvar-unidade";
import type { EstadoUnidade } from "./estado-unidade";
import { camposDoFormData, formularioUnidadeSchema } from "./formulario-unidade-schema";

export async function criarUnidade(_estado: EstadoUnidade, formData: FormData): Promise<EstadoUnidade> {
  const autor = await exigirUsuario(["ADMINISTRADOR"]);
  const entrada = formularioUnidadeSchema.safeParse(camposDoFormData(formData));
  if (!entrada.success) return erroDeValidacao(entrada.error.issues[0]?.message);

  let unidadeId: string;
  try {
    unidadeId = await salvarNovaUnidade(entrada.data.dados, autor);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
    throw erro;
  }
  revalidatePath("/cadastros/unidades");
  redirect(`/cadastros/unidades/${unidadeId}?unidadeCriada=1`);
}

export async function atualizarUnidade(
  unidadeId: string,
  _estado: EstadoUnidade,
  formData: FormData,
): Promise<EstadoUnidade> {
  const autor = await exigirUsuario([...PERFIS_UNIDADES]);
  const id = unidadeIdSchema.safeParse(unidadeId);
  if (!id.success) return { status: "erro", mensagem: "Unidade inválida." };
  const entrada = formularioUnidadeSchema.safeParse(camposDoFormData(formData));
  if (!entrada.success) return erroDeValidacao(entrada.error.issues[0]?.message);
  if (!entrada.data.atualizadoEm) {
    return { status: "erro", mensagem: "A versão da unidade é inválida. Atualize a página e tente novamente." };
  }

  try {
    const versaoAtualizada = await salvarAtualizacaoUnidade(
      id.data,
      entrada.data.dados,
      new Date(entrada.data.atualizadoEm),
      autor,
    );
    revalidarUnidade(id.data);
    return { status: "sucesso", mensagem: "Unidade atualizada.", identificador: versaoAtualizada.toISOString() };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      return erro instanceof VersaoDesatualizadaDaUnidade
        ? { status: "conflito", mensagem: erro.message }
        : { status: "erro", mensagem: erro.message };
    }
    throw erro;
  }
}

export async function alterarAtivacao(
  unidadeId: string,
  _estado: EstadoUnidade,
  formData: FormData,
): Promise<EstadoUnidade> {
  const autor = await exigirUsuario(["ADMINISTRADOR"]);
  const entrada = z
    .object({ unidadeId: unidadeIdSchema, operacao: z.enum(["ATIVAR", "INATIVAR"]) })
    .safeParse({ unidadeId, operacao: String(formData.get("operacao") ?? "") });
  if (!entrada.success) return { status: "erro", mensagem: "Operação inválida." };

  const versao = z.iso.datetime().safeParse(formData.get("atualizadoEm"));
  if (!versao.success) {
    return erroDeValidacao("A versão da unidade é inválida. Atualize a página e tente novamente.");
  }
  const ativa = entrada.data.operacao === "ATIVAR";
  try {
    const versaoAtualizada = await alterarAtivacaoUnidade(
      entrada.data.unidadeId,
      ativa,
      new Date(versao.data),
      autor,
    );
    revalidarUnidade(entrada.data.unidadeId);
    return {
      status: "sucesso",
      mensagem: ativa ? "Unidade ativada." : "Unidade inativada.",
      identificador: versaoAtualizada.toISOString(),
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      return erro instanceof VersaoDesatualizadaDaUnidade
        ? { status: "conflito", mensagem: erro.message, versaoEnviada: versao.data }
        : { status: "erro", mensagem: erro.message };
    }
    throw erro;
  }
}

function erroDeValidacao(mensagem?: string): EstadoUnidade {
  return { status: "erro", mensagem: mensagem ?? "Dados inválidos." };
}

function revalidarUnidade(unidadeId: string) {
  revalidatePath("/cadastros/unidades");
  revalidatePath(`/cadastros/unidades/${unidadeId}`);
}
