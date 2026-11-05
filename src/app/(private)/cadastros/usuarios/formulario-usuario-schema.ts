import { z } from "zod";

import { atualizacaoUsuarioSchema, novoUsuarioSchema } from "@/lib/usuario/dados-usuario";

export const versaoUsuarioSchema = z.iso.datetime("Versão inválida. Atualize a página.");

export const formularioCriacaoUsuarioSchema = novoUsuarioSchema
  .extend({ unidadeIds: novoUsuarioSchema.shape.unidadeIds.unwrap(), equipeIds: novoUsuarioSchema.shape.equipeIds.unwrap() })
  .superRefine(({ perfil, unidadeIds, equipeIds }, contexto) => {
    const porUnidade = perfil === "COORDENACAO" || perfil === "SECRETARIA";
    const campo = porUnidade ? "unidadeIds" : "equipeIds";
    if ((porUnidade ? unidadeIds : equipeIds).length === 0) {
      contexto.addIssue({ code: "custom", path: [campo], message: "Selecione ao menos um vínculo." });
    }
  });

export const formularioEdicaoUsuarioSchema = atualizacaoUsuarioSchema.extend({
  unidadeIds: atualizacaoUsuarioSchema.shape.unidadeIds.unwrap(),
  equipeIds: atualizacaoUsuarioSchema.shape.equipeIds.unwrap(),
  atualizadoEm: versaoUsuarioSchema,
});

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
