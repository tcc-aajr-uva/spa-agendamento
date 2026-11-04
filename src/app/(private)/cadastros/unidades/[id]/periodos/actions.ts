"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { chaveDoPeriodo, datasPeriodoSchema } from "@/lib/periodo-letivo/dados-periodo";
import { PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { criarPeriodo as criar, atualizarPeriodo as atualizar, excluirPeriodo as excluir, VersaoDesatualizadaDoPeriodo } from "@/lib/periodo-letivo/salvar-periodo";

export type EstadoPeriodo = { erro?: string; versaoEmConflito?: string; indisponivel?: boolean };

export async function criarPeriodo(unidadeId: string, _estado: EstadoPeriodo, formData: FormData): Promise<EstadoPeriodo> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  let id: string;
  try {
    id = await criar(unidadeId, dadosDoFormulario(formData), autor);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  revalidar(unidadeId);
  redirect(`/cadastros/unidades/${unidadeId}?periodoSalvo=${id}&confirmacaoPeriodo=${Date.now()}#periodos`);
}

export async function atualizarPeriodo(unidadeId: string, id: string, _estado: EstadoPeriodo, formData: FormData): Promise<EstadoPeriodo> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  try {
    const versao = lerVersao(formData);
    await atualizar(unidadeId, id, dadosDoFormulario(formData), versao, autor);
  } catch (erro) {
    return tratarErro(erro, formData);
  }
  revalidar(unidadeId, id);
  redirect(`/cadastros/unidades/${unidadeId}?periodoSalvo=${id}&confirmacaoPeriodo=${Date.now()}#periodos`);
}

export async function excluirPeriodo(unidadeId: string, id: string, _estado: EstadoPeriodo, formData: FormData): Promise<EstadoPeriodo> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  try {
    await excluir(unidadeId, id, lerVersao(formData), autor);
  } catch (erro) {
    return tratarErro(erro, formData);
  }
  revalidar(unidadeId, id);
  redirect(`/cadastros/unidades/${unidadeId}?excluido=${id}&confirmacaoPeriodo=${Date.now()}#periodos`);
}

function tratarErro(erro: unknown, formData: FormData): EstadoPeriodo {
  if (erro instanceof VersaoDesatualizadaDoPeriodo) {
    return { versaoEmConflito: chaveDoPeriodo(lerVersao(formData)) };
  }
  if (erro instanceof ErroDeRegra) {
    if (erro.codigo === "NAO_ENCONTRADO") return { indisponivel: true };
    return { erro: erro.message };
  }
  throw erro;
}

function dadosDoFormulario(formData: FormData) {
  return { inicio: String(formData.get("inicio") ?? ""), fim: String(formData.get("fim") ?? "") };
}

function lerVersao(formData: FormData) {
  let entrada: unknown;
  try { entrada = JSON.parse(String(formData.get("versao") ?? "")); }
  catch { throw new ErroDeRegra("DADOS_INVALIDOS", "Versão inválida. Atualize a página."); }
  const resultado = datasPeriodoSchema.safeParse(entrada);
  if (!resultado.success) throw new ErroDeRegra("DADOS_INVALIDOS", "Versão inválida. Atualize a página.");
  return resultado.data;
}

function revalidar(unidadeId: string, id?: string) {
  revalidatePath(`/cadastros/unidades/${unidadeId}`);
  revalidatePath(`/cadastros/unidades/${unidadeId}/periodos`);
  if (id) revalidatePath(`/cadastros/unidades/${unidadeId}/periodos/${id}`);
  revalidatePath("/agendar");
  revalidatePath("/reservas");
  revalidatePath("/lista-espera");
}
