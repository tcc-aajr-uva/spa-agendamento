"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { unidadeIdSchema, type DadosUnidade } from "@/lib/unidade/dados-unidade";
import { PERFIS_UNIDADES } from "@/lib/unidade/escopo-unidade";
import {
  alterarAtivacaoUnidade,
  atualizarUnidade as salvarAtualizacaoUnidade,
  criarUnidade as salvarNovaUnidade,
} from "@/lib/unidade/salvar-unidade";

export type EstadoUnidade = {
  erro?: string;
  sucesso?: string;
  versaoSucesso?: number;
};

export async function criarUnidade(_estado: EstadoUnidade, formData: FormData): Promise<EstadoUnidade> {
  const autor = await exigirUsuario(["ADMINISTRADOR"]);
  let unidadeId: string;
  try {
    unidadeId = await salvarNovaUnidade(dadosDoFormulario(formData), autor);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  revalidatePath("/cadastros/unidades");
  redirect(`/cadastros/unidades/${unidadeId}`);
}

export async function atualizarUnidade(
  unidadeId: string,
  _estado: EstadoUnidade,
  formData: FormData,
): Promise<EstadoUnidade> {
  const autor = await exigirUsuario([...PERFIS_UNIDADES]);
  const id = unidadeIdSchema.safeParse(unidadeId);
  if (!id.success) return { erro: "Unidade inválida." };
  const versao = z.iso.datetime().safeParse(String(formData.get("atualizadoEm") ?? ""));
  if (!versao.success) return { erro: "A versão da unidade é inválida. Atualize a página e tente novamente." };

  try {
    await salvarAtualizacaoUnidade(id.data, dadosDoFormulario(formData), new Date(versao.data), autor);
    revalidarUnidade(id.data);
    return { sucesso: "Unidade atualizada.", versaoSucesso: Date.now() };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      if (erro.codigo === "CONFLITO_CONCORRENTE") revalidarUnidade(id.data);
      return { erro: erro.message };
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
  if (!entrada.success) return { erro: "Operação inválida." };

  const ativa = entrada.data.operacao === "ATIVAR";
  try {
    await alterarAtivacaoUnidade(entrada.data.unidadeId, ativa, autor);
    revalidarUnidade(entrada.data.unidadeId);
    return {
      sucesso: ativa ? "Unidade ativada." : "Unidade inativada.",
      versaoSucesso: Date.now(),
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

function dadosDoFormulario(formData: FormData): DadosUnidade {
  return {
    nome: String(formData.get("nome") ?? ""),
    permitePaciente: valorBooleano(formData, "permitePaciente"),
    permiteEstagiario: valorBooleano(formData, "permiteEstagiario"),
    permiteSecretaria: valorBooleano(formData, "permiteSecretaria"),
    agendamentoAberto: valorBooleano(formData, "agendamentoAberto"),
    horaAbertura: converterHoraEmMinutos(formData.get("horaAbertura")),
    horaFechamento: converterHoraEmMinutos(formData.get("horaFechamento")),
    duracaoBlocoMin: Number(formData.get("duracaoBlocoMin")),
  };
}

function valorBooleano(formData: FormData, campo: string): boolean {
  const valor = formData.get(campo);
  return valor === "on" || valor === "true";
}

function converterHoraEmMinutos(valor: FormDataEntryValue | null): number {
  const partes = String(valor ?? "").match(/^(\d{2}):(\d{2})$/);
  if (!partes) return Number.NaN;
  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (horas > 23 || minutos > 59) return Number.NaN;
  return horas * 60 + minutos;
}

function revalidarUnidade(unidadeId: string) {
  revalidatePath("/cadastros/unidades");
  revalidatePath(`/cadastros/unidades/${unidadeId}`);
}
