import { z } from "zod";

import { novaEquipeSchema, versaoEquipeSchema, type NovaEquipe } from "@/lib/equipe/dados-equipe";

export type ValoresEquipe = NovaEquipe & { ativa: boolean; atualizadoEm: string };
export const VALORES_PADRAO_EQUIPE: ValoresEquipe = {
  nome: "", unidadeId: "", ativa: true, supervisorId: null, atualizadoEm: "",
};
export const formularioEquipeSchema = novaEquipeSchema.extend({ atualizadoEm: z.literal("") });
export const formularioEdicaoEquipeSchema = novaEquipeSchema.extend({ atualizadoEm: versaoEquipeSchema });
export type CamposEquipe = z.input<typeof formularioEdicaoEquipeSchema>;

export function valoresDoFormulario(valores: ValoresEquipe): CamposEquipe {
  return {
    nome: valores.nome,
    unidadeId: valores.unidadeId,
    supervisorId: valores.supervisorId,
    atualizadoEm: valores.atualizadoEm,
  };
}

export function formDataDosDados(dados: CamposEquipe, editando: boolean) {
  const formData = new FormData();
  formData.set("nome", dados.nome);
  formData.set("supervisorId", dados.supervisorId ?? "");
  if (editando) formData.set("atualizadoEm", dados.atualizadoEm);
  else formData.set("unidadeId", dados.unidadeId);
  return formData;
}
