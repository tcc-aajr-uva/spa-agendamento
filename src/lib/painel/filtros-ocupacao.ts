import { hojeNoBrasil } from "@/lib/agendamento/regras";

export type Parametros = Record<string, string | string[] | undefined>;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function resolverFiltros(parametros: Parametros, unidades: { id: string }[], agora: Date) {
  const unidadeId = unidades.find((unidade) => unidade.id === primeiro(parametros.unidade))?.id ?? unidades[0]?.id ?? null;

  const dia = Number(primeiro(parametros.dia));
  const hoje = hojeNoBrasil(agora).getUTCDay();
  const diaSemana = Number.isInteger(dia) && dia >= 1 && dia <= 6 ? dia : hoje === 0 ? 1 : hoje;

  return { unidadeId, diaSemana };
}