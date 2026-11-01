import { z } from "zod";

export const perfisCriaveisSchema = z.enum(["COORDENACAO", "SECRETARIA", "SUPERVISOR", "ESTAGIARIO"]);
export const usuarioIdSchema = z.cuid2();

const idsSchema = z
  .array(z.string().trim().min(1))
  .max(50, "Selecione no máximo 50 vínculos.")
  .refine((ids) => new Set(ids).size === ids.length, "Não repita vínculos.");

export const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120, "O nome deve possuir no máximo 120 caracteres."),
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  perfil: perfisCriaveisSchema,
  unidadeIds: idsSchema.default([]),
  equipeIds: idsSchema.default([]),
});

export const atualizacaoUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120, "O nome deve possuir no máximo 120 caracteres."),
  unidadeIds: idsSchema.default([]),
  equipeIds: idsSchema.default([]),
});

export type NovoUsuario = z.input<typeof novoUsuarioSchema>;
export type NovoUsuarioValidado = z.output<typeof novoUsuarioSchema>;
export type AtualizacaoUsuario = z.input<typeof atualizacaoUsuarioSchema>;
