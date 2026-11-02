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

export const versaoEquipeSchema = z.object({
  nome: z.string(),
  unidadeId: z.cuid2(),
  ativa: z.boolean(),
  supervisorId: z.cuid2().nullable(),
});

export type NovaEquipe = z.input<typeof novaEquipeSchema>;
export type EdicaoEquipe = z.input<typeof edicaoEquipeSchema>;
export type VersaoEquipe = z.infer<typeof versaoEquipeSchema>;

export function chaveDaEquipe(equipe: VersaoEquipe): string {
  return JSON.stringify({
    nome: equipe.nome,
    unidadeId: equipe.unidadeId,
    ativa: equipe.ativa,
    supervisorId: equipe.supervisorId,
  });
}
