"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { versaoEquipeSchema } from "@/lib/equipe/dados-equipe";
import { PERFIS_GESTAO_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { criarEquipe as salvarNovaEquipe, atualizarEquipe as salvarEquipe, alterarAtivacaoEquipe } from "@/lib/equipe/salvar-equipe";

export type EstadoEquipe = { erro?: string; sucesso?: string; versaoSucesso?: number };

export async function criarEquipe(_estado: EstadoEquipe, formData: FormData): Promise<EstadoEquipe> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  let id: string;
  try {
    id = await salvarNovaEquipe({ ...dadosDoFormulario(formData), unidadeId: texto(formData, "unidadeId") }, autor);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  revalidarEquipes();
  redirect(`/cadastros/equipes/${id}`);
}

export async function atualizarEquipe(id: string, estado: EstadoEquipe, formData: FormData): Promise<EstadoEquipe> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  try {
    await salvarEquipe(id, dadosDoFormulario(formData), lerVersao(formData), autor);
    revalidarEquipes(id);
    return { sucesso: "Equipe atualizada.", versaoSucesso: (estado.versaoSucesso ?? 0) + 1 };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      if (erro.codigo === "CONFLITO_CONCORRENTE") revalidarEquipes(id);
      return { erro: erro.message, versaoSucesso: estado.versaoSucesso };
    }
    throw erro;
  }
}

export async function alterarAtivacao(id: string, estado: EstadoEquipe, formData: FormData): Promise<EstadoEquipe> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  const operacao = texto(formData, "operacao");
  if (operacao !== "ATIVAR" && operacao !== "INATIVAR") return { erro: "Operação inválida.", versaoSucesso: estado.versaoSucesso };
  try {
    await alterarAtivacaoEquipe(id, operacao === "ATIVAR", lerVersao(formData), autor);
    revalidarEquipes(id);
    return {
      sucesso: operacao === "ATIVAR" ? "Equipe ativada." : "Equipe inativada.",
      versaoSucesso: (estado.versaoSucesso ?? 0) + 1,
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      if (erro.codigo === "CONFLITO_CONCORRENTE") revalidarEquipes(id);
      return { erro: erro.message, versaoSucesso: estado.versaoSucesso };
    }
    throw erro;
  }
}

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "");
}

function dadosDoFormulario(formData: FormData) {
  return { nome: texto(formData, "nome"), supervisorId: texto(formData, "supervisorId") || null };
}

function lerVersao(formData: FormData) {
  let entrada: unknown;
  try {
    entrada = JSON.parse(texto(formData, "versao"));
  } catch {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Versão inválida. Atualize a página.");
  }
  const resultado = versaoEquipeSchema.safeParse(entrada);
  if (!resultado.success) throw new ErroDeRegra("DADOS_INVALIDOS", "Versão inválida. Atualize a página.");
  return resultado.data;
}

function revalidarEquipes(id?: string) {
  revalidatePath("/cadastros/equipes");
  if (id) revalidatePath(`/cadastros/equipes/${id}`);
  revalidatePath("/cadastros/usuarios");
  revalidatePath("/cadastros/usuarios/novo");
  revalidatePath("/cadastros/usuarios/[id]", "page");
}
