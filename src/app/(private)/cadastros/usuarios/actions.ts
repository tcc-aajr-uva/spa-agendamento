"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { criarUsuarioComConvite } from "@/lib/usuario/criar-usuario";
import { perfisCriaveisSchema, usuarioIdSchema } from "@/lib/usuario/dados-usuario";
import { gerarNovoConvite, revogarConvite } from "@/lib/usuario/gerenciar-convite";

const PERFIS_AUTORIZADOS = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR"] as const;
const gerenciarConviteSchema = z.object({
  usuarioId: usuarioIdSchema,
  operacao: z.enum(["GERAR", "REVOGAR"]),
});

export type EstadoCriacaoUsuario = {
  erro?: string;
  linkConvite?: string;
  expiraEm?: string;
};

export type EstadoGerenciamentoConvite = {
  erro?: string;
  mensagem?: string;
  linkConvite?: string;
  expiraEm?: string;
};

export async function criarUsuario(
  _estado: EstadoCriacaoUsuario,
  formData: FormData,
): Promise<EstadoCriacaoUsuario> {
  const autor = await exigirUsuario([...PERFIS_AUTORIZADOS]);
  const perfil = perfisCriaveisSchema.safeParse(String(formData.get("perfil") ?? ""));
  if (!perfil.success) return { erro: "Selecione um perfil válido." };

  try {
    const resultado = await criarUsuarioComConvite(
      {
        nome: String(formData.get("nome") ?? ""),
        email: String(formData.get("email") ?? ""),
        perfil: perfil.data,
        unidadeIds: textos(formData, "unidadeIds"),
        equipeIds: textos(formData, "equipeIds"),
      },
      autor,
    );
    revalidatePath("/cadastros/usuarios");

    revalidatePath("/cadastros/equipes");
    revalidatePath("/cadastros/equipes/[id]", "page");
    revalidatePath("/cadastros/equipes/nova");

    const baseURL = process.env.BETTER_AUTH_URL;
    return {
      linkConvite: baseURL ? new URL(resultado.linkConvite, baseURL).toString() : resultado.linkConvite,
      expiraEm: resultado.expiraEm.toISOString(),
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

export async function gerenciarConvite(
  usuarioId: string,
  _estado: EstadoGerenciamentoConvite,
  formData: FormData,
): Promise<EstadoGerenciamentoConvite> {
  const autor = await exigirUsuario([...PERFIS_AUTORIZADOS]);
  const entrada = gerenciarConviteSchema.safeParse({
    usuarioId,
    operacao: String(formData.get("operacao") ?? ""),
  });
  if (!entrada.success) return { erro: "Operação de convite inválida." };
  const caminhoConvites = `/cadastros/usuarios/${entrada.data.usuarioId}/convites`;
  const caminhoUsuario = `/cadastros/usuarios/${entrada.data.usuarioId}`;

  try {
    if (entrada.data.operacao === "REVOGAR") {
      await revogarConvite(entrada.data.usuarioId, autor);
      revalidatePath("/cadastros/usuarios");
      revalidatePath(caminhoConvites);
      revalidatePath(caminhoUsuario);
      return { mensagem: "Convite revogado." };
    }

    const resultado = await gerarNovoConvite(entrada.data.usuarioId, autor);
    revalidatePath("/cadastros/usuarios");
    revalidatePath(caminhoConvites);
    revalidatePath(caminhoUsuario);
    const baseURL = process.env.BETTER_AUTH_URL;
    return {
      mensagem: "Novo convite gerado. Compartilhe somente o link abaixo.",
      linkConvite: baseURL ? new URL(resultado.linkConvite, baseURL).toString() : resultado.linkConvite,
      expiraEm: resultado.expiraEm.toISOString(),
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

function textos(formData: FormData, campo: string): string[] {
  return formData.getAll(campo).map(String);
}
