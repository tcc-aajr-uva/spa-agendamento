import { z } from "zod";

export const equipeIdSchema = z.cuid2();

export const nomeEquipeSchema = z.string().trim()
  .min(2, "Informe o nome da equipe.")
  .max(120, "O nome deve possuir no máximo 120 caracteres.");

export const edicaoEquipeSchema = z.object({
  nome: nomeEquipeSchema,
  supervisorId: z.cuid2("Escolha um supervisor válido.").nullable(),
});

export const novaEquipeSchema = edicaoEquipeSchema.extend({
  unidadeId: z.cuid2("Escolha uma unidade válida."),
});

export const versaoEquipeSchema = z.iso.datetime("Versão inválida. Atualize a página.");

export type NovaEquipe = z.input<typeof novaEquipeSchema>;
export type EdicaoEquipe = z.input<typeof edicaoEquipeSchema>;
