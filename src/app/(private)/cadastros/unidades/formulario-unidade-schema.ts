import { z } from "zod";

import { formatarHora } from "@/lib/agendamento/regras";
import {
  dadosUnidadeSchema,
  duracaoCabeNoIntervalo,
  horariosEmOrdem,
  mensagemDuracaoNoIntervalo,
  mensagemLimiteFechamento,
  mensagemOrdemHorarios,
} from "@/lib/unidade/dados-unidade";

const horarioSchema = (mensagem: string) =>
  z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, mensagem);

const horariosSchema = z.object({
  horaAbertura: horarioSchema("Informe o horário de abertura."),
  horaFechamento: horarioSchema("Informe o horário de fechamento.").refine(
    (valor) => {
      const minutos = converterHoraEmMinutos(valor);
      return Number.isNaN(minutos) || dadosUnidadeSchema.shape.horaFechamento.safeParse(minutos).success;
    },
    mensagemLimiteFechamento,
  ),
});

const funcionamentoSchema = horariosSchema.extend({
  duracaoBlocoMin: z
    .string()
    .regex(/^\d+$/, "Informe a duração do bloco.")
    .refine((valor) => Number.isSafeInteger(Number(valor)), "Informe uma duração válida.")
    .transform(Number)
    .pipe(dadosUnidadeSchema.shape.duracaoBlocoMin),
});

const duracaoConvertidaSchema = z.object({
  duracaoBlocoMin: dadosUnidadeSchema.shape.duracaoBlocoMin,
});

export type ValoresUnidade = {
  nome: string;
  permitePaciente: boolean;
  permiteEstagiario: boolean;
  permiteSecretaria: boolean;
  agendamentoAberto: boolean;
  horaAbertura: number;
  horaFechamento: number;
  duracaoBlocoMin: number;
  atualizadoEm: string;
};

export const VALORES_PADRAO_UNIDADE: ValoresUnidade = {
  nome: "",
  permitePaciente: true,
  permiteEstagiario: true,
  permiteSecretaria: true,
  agendamentoAberto: false,
  horaAbertura: 480,
  horaFechamento: 1260,
  duracaoBlocoMin: 50,
  atualizadoEm: "",
};

export const formularioUnidadeSchema = z
  .object({
    nome: dadosUnidadeSchema.shape.nome,
    permitePaciente: z.boolean(),
    permiteEstagiario: z.boolean(),
    permiteSecretaria: z.boolean(),
    agendamentoAberto: z.boolean(),
    ...funcionamentoSchema.shape,
    atualizadoEm: z.string().refine(
      (valor) => valor === "" || z.iso.datetime().safeParse(valor).success,
      "A versão da unidade é inválida. Atualize a página e tente novamente.",
    ),
  })
  .refine(
    ({ horaAbertura, horaFechamento }) =>
      horariosEmOrdem(
        converterHoraEmMinutos(horaAbertura),
        converterHoraEmMinutos(horaFechamento),
      ),
    {
      path: ["horaFechamento"],
      message: mensagemOrdemHorarios,
      when: ({ value }) => horariosSchema.safeParse(value).success,
    },
  )
  .refine(
    ({ horaAbertura, horaFechamento, duracaoBlocoMin }) => {
      const abertura = converterHoraEmMinutos(horaAbertura);
      const fechamento = converterHoraEmMinutos(horaFechamento);
      return !horariosEmOrdem(abertura, fechamento) ||
        duracaoCabeNoIntervalo(abertura, fechamento, duracaoBlocoMin);
    },
    {
      path: ["duracaoBlocoMin"],
      message: mensagemDuracaoNoIntervalo,
      when: ({ value }) =>
        horariosSchema.safeParse(value).success &&
        duracaoConvertidaSchema.safeParse(value).success,
    },
  )
  .transform((campos, contexto) => {
    const resultado = dadosUnidadeSchema.safeParse({
      ...campos,
      horaAbertura: converterHoraEmMinutos(campos.horaAbertura),
      horaFechamento: converterHoraEmMinutos(campos.horaFechamento),
    });
    if (resultado.success) {
      return { dados: resultado.data, atualizadoEm: campos.atualizadoEm };
    }

    for (const issue of resultado.error.issues) {
      contexto.addIssue({ code: "custom", message: issue.message, path: issue.path });
    }
    return z.NEVER;
  });

export type CamposFormularioUnidade = z.input<typeof formularioUnidadeSchema>;
export type DadosFormularioUnidade = z.output<typeof formularioUnidadeSchema>;

export function valoresDoFormulario(valores: ValoresUnidade): CamposFormularioUnidade {
  return {
    nome: valores.nome,
    permitePaciente: valores.permitePaciente,
    permiteEstagiario: valores.permiteEstagiario,
    permiteSecretaria: valores.permiteSecretaria,
    agendamentoAberto: valores.agendamentoAberto,
    horaAbertura: formatarHora(valores.horaAbertura),
    horaFechamento: formatarHora(valores.horaFechamento),
    duracaoBlocoMin: String(valores.duracaoBlocoMin),
    atualizadoEm: valores.atualizadoEm,
  };
}

export function camposDoFormData(formData: FormData): CamposFormularioUnidade {
  return {
    nome: String(formData.get("nome") ?? ""),
    permitePaciente: valorBooleano(formData, "permitePaciente"),
    permiteEstagiario: valorBooleano(formData, "permiteEstagiario"),
    permiteSecretaria: valorBooleano(formData, "permiteSecretaria"),
    agendamentoAberto: valorBooleano(formData, "agendamentoAberto"),
    horaAbertura: String(formData.get("horaAbertura") ?? ""),
    horaFechamento: String(formData.get("horaFechamento") ?? ""),
    duracaoBlocoMin: String(formData.get("duracaoBlocoMin") ?? ""),
    atualizadoEm: String(formData.get("atualizadoEm") ?? ""),
  };
}

export function formDataDosDados({ dados, atualizadoEm }: DadosFormularioUnidade): FormData {
  const formData = new FormData();
  formData.set("nome", dados.nome);
  formData.set("permitePaciente", String(dados.permitePaciente));
  formData.set("permiteEstagiario", String(dados.permiteEstagiario));
  formData.set("permiteSecretaria", String(dados.permiteSecretaria));
  formData.set("agendamentoAberto", String(dados.agendamentoAberto));
  formData.set("horaAbertura", formatarHora(dados.horaAbertura));
  formData.set("horaFechamento", formatarHora(dados.horaFechamento));
  formData.set("duracaoBlocoMin", String(dados.duracaoBlocoMin));
  formData.set("atualizadoEm", atualizadoEm);
  return formData;
}

export function chaveDosValores(valores: ValoresUnidade): string {
  return JSON.stringify(valoresDoFormulario(valores));
}

function valorBooleano(formData: FormData, campo: string): boolean {
  const valor = formData.get(campo);
  return valor === "on" || valor === "true";
}

function converterHoraEmMinutos(valor: string): number {
  const partes = valor.match(/^(\d{2}):(\d{2})$/);
  if (!partes) return Number.NaN;
  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (horas > 23 || minutos > 59) return Number.NaN;
  return horas * 60 + minutos;
}
