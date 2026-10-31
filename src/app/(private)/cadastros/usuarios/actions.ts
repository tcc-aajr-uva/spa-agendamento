"use server";

import { revalidatePath } from "next/cache";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { criarUsuarioComConvite } from "@/lib/usuario/criar-usuario";
import { perfisCriaveisSchema } from "@/lib/usuario/dados-usuario";

const PERFIS_AUTORIZADOS = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR"] as const;

export type EstadoCriacaoUsuario = {
  erro?: string;
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

function textos(formData: FormData, campo: string): string[] {
  return formData.getAll(campo).map(String);
}
