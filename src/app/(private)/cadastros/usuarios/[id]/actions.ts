"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { alterarAtivacaoUsuario } from "@/lib/usuario/alterar-ativacao-usuario";
import { atualizarUsuarioGerenciavel } from "@/lib/usuario/atualizar-usuario";
import { usuarioIdSchema } from "@/lib/usuario/dados-usuario";
import { perfisDaRota } from "../../../menu";

const operacaoAtivacaoSchema = z.enum(["ATIVAR", "INATIVAR"]);

export type EstadoEdicaoUsuario = {
  erro?: string;
  sucesso?: string;
};

export async function atualizarUsuario(
  usuarioId: string,
  _estado: EstadoEdicaoUsuario,
  formData: FormData,
): Promise<EstadoEdicaoUsuario> {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const id = usuarioIdSchema.safeParse(usuarioId);
  if (!id.success) return { erro: "Usuário inválido." };

  try {
    await atualizarUsuarioGerenciavel(
      id.data,
      {
        nome: String(formData.get("nome") ?? ""),
        unidadeIds: textos(formData, "unidadeIds"),
        equipeIds: textos(formData, "equipeIds"),
      },
      autor,
    );
    revalidarUsuario(id.data);
    return { sucesso: "Usuário atualizado." };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

export async function alterarAtivacao(
  usuarioId: string,
  _estado: EstadoEdicaoUsuario,
  formData: FormData,
): Promise<EstadoEdicaoUsuario> {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const entrada = z
    .object({ usuarioId: usuarioIdSchema, operacao: operacaoAtivacaoSchema })
    .safeParse({ usuarioId, operacao: String(formData.get("operacao") ?? "") });
  if (!entrada.success) return { erro: "Operação inválida." };

  const ativo = entrada.data.operacao === "ATIVAR";
  try {
    await alterarAtivacaoUsuario(entrada.data.usuarioId, ativo, autor);
    revalidarUsuario(entrada.data.usuarioId);
    return { sucesso: ativo ? "Usuário ativado." : "Usuário inativado." };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

function revalidarUsuario(usuarioId: string) {
  revalidatePath("/cadastros/usuarios");
  revalidatePath(`/cadastros/usuarios/${usuarioId}`);
  revalidatePath(`/cadastros/usuarios/${usuarioId}/convites`);
  revalidatePath("/cadastros/equipes");
  revalidatePath("/cadastros/equipes/[id]", "page");
  revalidatePath("/cadastros/equipes/nova");
}

function textos(formData: FormData, campo: string): string[] {
  return formData.getAll(campo).map(String);
}
