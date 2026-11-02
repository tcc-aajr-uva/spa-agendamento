import { z } from "zod";

export const periodoIdSchema = z.cuid2();
const dataPeriodoSchema = z.iso.date("Informe uma data válida.")
  .refine((data) => data >= "0001-01-01", "Informe um ano a partir de 1.");
export const datasPeriodoSchema = z.object({
  inicio: dataPeriodoSchema,
  fim: dataPeriodoSchema,
});
export const dadosPeriodoSchema = datasPeriodoSchema.refine((dados) => dados.fim > dados.inicio, {
  message: "A data de fim deve ser posterior à data de início.", path: ["fim"],
});
export const situacaoPeriodoSchema = z.enum(["TODOS", "FUTURO", "EM_ANDAMENTO", "ENCERRADO"]);
export type DatasPeriodo = z.infer<typeof datasPeriodoSchema>;
export type SituacaoPeriodo = Exclude<z.infer<typeof situacaoPeriodoSchema>, "TODOS">;

export function dataDoPeriodo(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function situacaoDoPeriodo(periodo: DatasPeriodo, hoje: string): SituacaoPeriodo {
  if (periodo.inicio > hoje) return "FUTURO";
  return periodo.fim < hoje ? "ENCERRADO" : "EM_ANDAMENTO";
}

export const ROTULOS_SITUACAO_PERIODO: Record<SituacaoPeriodo, string> = {
  FUTURO: "Futuro", EM_ANDAMENTO: "Em andamento", ENCERRADO: "Encerrado",
};

export function formatarDataPeriodo(data: string): string {
  return data.split("-").reverse().join("/");
}

export function chaveDoPeriodo(periodo: DatasPeriodo): string {
  return `${periodo.inicio}:${periodo.fim}`;
}
