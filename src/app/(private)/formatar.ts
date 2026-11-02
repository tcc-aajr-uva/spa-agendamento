import { FUSO_HORARIO } from "@/lib/agendamento/regras";

export function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatarDataHora(data: Date): string {
  return data.toLocaleString("pt-BR", { timeZone: FUSO_HORARIO, dateStyle: "short", timeStyle: "short" });
}
