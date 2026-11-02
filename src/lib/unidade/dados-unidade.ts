import { z } from "zod";

export const unidadeIdSchema = z.cuid2();

export const dadosUnidadeSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome.").max(120, "O nome deve possuir no máximo 120 caracteres."),
    permitePaciente: z.boolean(),
    permiteEstagiario: z.boolean(),
    permiteSecretaria: z.boolean(),
    agendamentoAberto: z.boolean(),
    horaAbertura: z.number().int().min(0).max(1439),
    horaFechamento: z.number().int().min(1).max(1439),
    duracaoBlocoMin: z.number().int().min(1, "Informe a duração do bloco.").max(720),
  })
  .superRefine((dados, contexto) => {
    if (dados.horaFechamento <= dados.horaAbertura) {
      contexto.addIssue({
        code: "custom",
        message: "O horário de fechamento deve ser posterior ao de abertura.",
        path: ["horaFechamento"],
      });
    }
    if (dados.duracaoBlocoMin > dados.horaFechamento - dados.horaAbertura) {
      contexto.addIssue({
        code: "custom",
        message: "A duração do bloco deve caber no horário de funcionamento.",
        path: ["duracaoBlocoMin"],
      });
    }
  });

export type DadosUnidade = z.input<typeof dadosUnidadeSchema>;
