import { z } from "zod";

export const unidadeIdSchema = z.cuid2();

export const mensagemOrdemHorarios = "O horário de fechamento deve ser posterior ao de abertura.";
export const mensagemLimiteFechamento = "O fechamento deve ocorrer após a abertura, no mesmo dia, até as 23:59.";
export const mensagemDuracaoNoIntervalo = "A duração do bloco deve caber no horário de funcionamento.";

export function horariosEmOrdem(abertura: number, fechamento: number): boolean {
  return fechamento > abertura;
}

export function duracaoCabeNoIntervalo(abertura: number, fechamento: number, duracao: number): boolean {
  return duracao <= fechamento - abertura;
}

export const dadosUnidadeSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome.").max(120, "O nome deve possuir no máximo 120 caracteres."),
    permitePaciente: z.boolean(),
    permiteEstagiario: z.boolean(),
    permiteSecretaria: z.boolean(),
    agendamentoAberto: z.boolean(),
    horaAbertura: z.number().int().min(0).max(1439),
    horaFechamento: z.number().int().min(1, mensagemLimiteFechamento).max(1439, mensagemLimiteFechamento),
    duracaoBlocoMin: z.number().int().min(1, "Informe a duração do bloco.").max(720),
  })
  .superRefine((dados, contexto) => {
    if (!horariosEmOrdem(dados.horaAbertura, dados.horaFechamento)) {
      contexto.addIssue({
        code: "custom",
        message: mensagemOrdemHorarios,
        path: ["horaFechamento"],
      });
    }
    if (!duracaoCabeNoIntervalo(dados.horaAbertura, dados.horaFechamento, dados.duracaoBlocoMin)) {
      contexto.addIssue({
        code: "custom",
        message: mensagemDuracaoNoIntervalo,
        path: ["duracaoBlocoMin"],
      });
    }
  });

export type DadosUnidade = z.input<typeof dadosUnidadeSchema>;
