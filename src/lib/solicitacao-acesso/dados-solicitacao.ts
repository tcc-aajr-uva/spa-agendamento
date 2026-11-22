import { z } from "zod";

import { novoUsuarioSchema } from "@/lib/usuario/dados-usuario";
import { erroDeFormatoDosVinculos } from "@/lib/usuario/regras-vinculos";

export const solicitacaoIdSchema = z.cuid2("Solicitação inválida.");

export const novaSolicitacaoSchema = z.object({
  nome: novoUsuarioSchema.shape.nome,
  email: novoUsuarioSchema.shape.email,
  unidadeId: z.cuid2("Selecione a unidade."),
});

export const aprovacaoSolicitacaoSchema = z.object({
  unidadeIds: novoUsuarioSchema.shape.unidadeIds.unwrap(),
  equipeIds: novoUsuarioSchema.shape.equipeIds.unwrap(),
}).superRefine(({ unidadeIds, equipeIds }, contexto) => {
  const erro = erroDeFormatoDosVinculos("ESTAGIARIO", unidadeIds, equipeIds);
  if (erro) contexto.addIssue({ code: "custom", path: [erro.campo], message: erro.mensagem });
});

export const TAMANHO_MAXIMO_MOTIVO = 500;

export const recusaSolicitacaoSchema = z.object({
  motivo: z.string().trim().max(TAMANHO_MAXIMO_MOTIVO, `O motivo deve possuir no máximo ${TAMANHO_MAXIMO_MOTIVO} caracteres.`),
});

export type NovaSolicitacao = z.input<typeof novaSolicitacaoSchema>;
export type AprovacaoSolicitacao = z.input<typeof aprovacaoSolicitacaoSchema>;
export type RecusaSolicitacao = z.input<typeof recusaSolicitacaoSchema>;
