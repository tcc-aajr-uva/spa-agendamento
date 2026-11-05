"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { versaoEquipeSchema } from "@/lib/equipe/dados-equipe";
import { PERFIS_GESTAO_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { criarEquipe as salvarNovaEquipe, atualizarEquipe as salvarEquipe, alterarAtivacaoEquipe, VersaoDesatualizadaDaEquipe } from "@/lib/equipe/salvar-equipe";

import type { EstadoEquipe } from "./estado-equipe";

export async function criarEquipe(_estado: EstadoEquipe, formData: FormData): Promise<EstadoEquipe> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  let id: string;
  try {
    id = await salvarNovaEquipe({ ...dadosDoFormulario(formData), unidadeId: texto(formData, "unidadeId") }, autor);
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
    throw erro;
  }
  revalidarEquipes();
  redirect(`/cadastros/equipes/${id}?equipeCriada=1`);
}

export async function atualizarEquipe(id: string, _estado: EstadoEquipe, formData: FormData): Promise<EstadoEquipe> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  try {
    const versaoSalva = await salvarEquipe(id, dadosDoFormulario(formData), lerVersao(formData), autor);
    revalidarEquipes(id);
    return { status: "sucesso", mensagem: "Equipe atualizada.", identificador: versaoSalva.toISOString() };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      return tratarErroDeAlteracao(erro, formData, id);
    }
    throw erro;
  }
}

export async function alterarAtivacao(id: string, _estado: EstadoEquipe, formData: FormData): Promise<EstadoEquipe> {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  const operacao = texto(formData, "operacao");
  if (operacao !== "ATIVAR" && operacao !== "INATIVAR") return { status: "erro", mensagem: "Operação inválida." };
  try {
    const versaoSalva = await alterarAtivacaoEquipe(id, operacao === "ATIVAR", lerVersao(formData), autor);
    revalidarEquipes(id);
    return {
      status: "sucesso",
      mensagem: operacao === "ATIVAR" ? "Equipe ativada." : "Equipe inativada.",
      identificador: versaoSalva.toISOString(),
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) {
      return tratarErroDeAlteracao(erro, formData, id);
    }
    throw erro;
  }
}

function tratarErroDeAlteracao(erro: ErroDeRegra, formData: FormData, id: string): EstadoEquipe {
  if (erro instanceof VersaoDesatualizadaDaEquipe) {
    revalidarEquipes(id);
    return { status: "conflito", mensagem: erro.message, versaoEnviada: lerVersao(formData).toISOString() };
  }
  return { status: "erro", mensagem: erro.message };
}

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "");
}

function dadosDoFormulario(formData: FormData) {
  return { nome: texto(formData, "nome"), supervisorId: texto(formData, "supervisorId") || null };
}

function lerVersao(formData: FormData) {
  const resultado = versaoEquipeSchema.safeParse(formData.get("atualizadoEm"));
  if (!resultado.success) throw new ErroDeRegra("DADOS_INVALIDOS", "Versão inválida. Atualize a página.");
  return new Date(resultado.data);
}

function revalidarEquipes(id?: string) {
  revalidatePath("/cadastros/equipes");
  if (id) revalidatePath(`/cadastros/equipes/${id}`);
  revalidatePath("/cadastros/usuarios");
  revalidatePath("/cadastros/usuarios/novo");
  revalidatePath("/cadastros/usuarios/[id]", "page");
}
