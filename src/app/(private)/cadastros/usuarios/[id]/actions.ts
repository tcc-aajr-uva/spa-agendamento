"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { alterarAtivacaoUsuario } from "@/lib/usuario/alterar-ativacao-usuario";
import { atualizarUsuarioGerenciavel } from "@/lib/usuario/atualizar-usuario";
import { usuarioIdSchema } from "@/lib/usuario/dados-usuario";
import { VersaoDesatualizadaDoUsuario } from "@/lib/usuario/versao-usuario";
import { perfisDaRota } from "../../../menu";
import type { EstadoEdicaoUsuario } from "../estado-usuario";
import { camposDoFormData, formularioEdicaoUsuarioSchema, versaoUsuarioSchema } from "../formulario-usuario-schema";

export async function atualizarUsuario(usuarioId: string, _estado: EstadoEdicaoUsuario, formData: FormData): Promise<EstadoEdicaoUsuario> {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  if (!usuarioIdSchema.safeParse(usuarioId).success) return { status: "erro", mensagem: "Usuário inválido." };
  const entrada = formularioEdicaoUsuarioSchema.safeParse({
    ...camposDoFormData(formData), atualizadoEm: formData.get("atualizadoEm"),
  });
  if (!entrada.success) return { status: "erro", mensagem: entrada.error.issues[0].message };

  const { atualizadoEm, ...dados } = entrada.data;
  return executarAlteracao(usuarioId, atualizadoEm, "Usuário atualizado.", () =>
    atualizarUsuarioGerenciavel(usuarioId, dados, new Date(atualizadoEm), autor),
  );
}

export async function alterarAtivacao(usuarioId: string, _estado: EstadoEdicaoUsuario, formData: FormData): Promise<EstadoEdicaoUsuario> {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const entrada = z.object({
    usuarioId: usuarioIdSchema, operacao: z.enum(["ATIVAR", "INATIVAR"]), atualizadoEm: versaoUsuarioSchema,
  }).safeParse({ usuarioId, operacao: formData.get("operacao"), atualizadoEm: formData.get("atualizadoEm") });
  if (!entrada.success) return { status: "erro", mensagem: "Operação ou versão inválida. Atualize a página." };

  const { atualizadoEm, operacao } = entrada.data;
  const ativo = operacao === "ATIVAR";
  return executarAlteracao(usuarioId, atualizadoEm, ativo ? "Usuário ativado." : "Usuário inativado.", () =>
    alterarAtivacaoUsuario(usuarioId, ativo, new Date(atualizadoEm), autor),
  );
}

async function executarAlteracao(
  id: string, versao: string, mensagem: string, executar: () => Promise<Date>,
): Promise<EstadoEdicaoUsuario> {
  try {
    const atualizadoEm = await executar();
    revalidarUsuario(id);
    return { status: "sucesso", mensagem, identificador: atualizadoEm.toISOString() };
  } catch (erro) {
    if (erro instanceof VersaoDesatualizadaDoUsuario) {
      revalidatePath(`/cadastros/usuarios/${id}`);
      return { status: "conflito", versaoEnviada: new Date(versao).toISOString() };
    }
    if (erro instanceof ErroDeRegra) return { status: "erro", mensagem: erro.message };
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
