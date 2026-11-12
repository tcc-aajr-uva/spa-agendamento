import { z } from "zod";

import { atualizacaoUsuarioSchema, novoUsuarioSchema } from "@/lib/usuario/dados-usuario";
import { erroDeFormatoDosVinculos } from "@/lib/usuario/regras-vinculos";
import type { PerfilCriavel } from "@/lib/usuario/hierarquia";

export const versaoUsuarioSchema = z.iso.datetime("Versão inválida. Atualize a página.");

export const formularioCriacaoUsuarioSchema = novoUsuarioSchema
  .extend({ unidadeIds: novoUsuarioSchema.shape.unidadeIds.unwrap(), equipeIds: novoUsuarioSchema.shape.equipeIds.unwrap() })
  .superRefine(({ perfil, unidadeIds, equipeIds }, contexto) => {
    const erro = erroDeFormatoDosVinculos(perfil, unidadeIds, equipeIds);
    if (erro) contexto.addIssue({ code: "custom", path: [erro.campo], message: erro.mensagem });
  });

export const formularioEdicaoUsuarioSchema = atualizacaoUsuarioSchema.extend({
  unidadeIds: atualizacaoUsuarioSchema.shape.unidadeIds.unwrap(),
  equipeIds: atualizacaoUsuarioSchema.shape.equipeIds.unwrap(),
  atualizadoEm: versaoUsuarioSchema,
});

export function schemaEdicaoUsuario(perfil: PerfilCriavel, possuiVinculosForaDoEscopo: boolean) {
  return formularioEdicaoUsuarioSchema.superRefine(({ unidadeIds, equipeIds }, contexto) => {
    const erro = erroDeFormatoDosVinculos(perfil, unidadeIds, equipeIds, !possuiVinculosForaDoEscopo);
    if (erro) contexto.addIssue({ code: "custom", path: [erro.campo], message: erro.mensagem });
  });
}

export type CamposCriacaoUsuario = z.input<typeof formularioCriacaoUsuarioSchema>;
export type CamposEdicaoUsuario = z.input<typeof formularioEdicaoUsuarioSchema>;

export function formDataDoUsuario(dados: CamposCriacaoUsuario | CamposEdicaoUsuario): FormData {
  const formData = new FormData();
  formData.set("nome", dados.nome);
  for (const id of dados.unidadeIds) formData.append("unidadeIds", id);
  for (const id of dados.equipeIds) formData.append("equipeIds", id);
  if ("perfil" in dados) {
    formData.set("perfil", dados.perfil);
    formData.set("email", dados.email);
  } else {
    formData.set("atualizadoEm", dados.atualizadoEm);
  }
  return formData;
}

export function camposDoFormData(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? ""),
    unidadeIds: formData.getAll("unidadeIds").map(String),
    equipeIds: formData.getAll("equipeIds").map(String),
  };
}
