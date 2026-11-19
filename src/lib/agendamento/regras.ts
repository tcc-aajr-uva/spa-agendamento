import type { Prisma, StatusAgendamento, Turno } from "@/generated/prisma/client";

export const PRAZO_CONFIRMACAO_HORAS = 48;
export const FALTAS_SEGUIDAS_PARA_ENCERRAR = 3;
export const FUSO_HORARIO = "America/Sao_Paulo";
export const DIAS_DA_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const DIAS_EXIBIDOS = [1, 2, 3, 4, 5, 6];

export const INICIO_DA_TARDE = 12 * 60;

export const TURNOS: { valor: Turno; rotulo: string }[] = [
  { valor: "MANHA", rotulo: "Manhã" },
  { valor: "TARDE", rotulo: "Tarde" },
];

export type Grade = { horaAbertura: number; horaFechamento: number; duracaoBlocoMin: number };

export const FILTRO_RESERVA_ATIVA = { estagiarioAtivoChave: { not: null } } satisfies Prisma.AgendamentoWhereInput;

export function filtroAgendamentoAtivo(agora: Date): Prisma.AgendamentoWhereInput {
  return {
    ...FILTRO_RESERVA_ATIVA,
    OR: [{ status: { not: "PENDENTE" } }, { prazoConfirmacao: { gt: agora } }],
  };
}

export function estaOcupando(
  agendamento: { status: StatusAgendamento; prazoConfirmacao: Date; estagiarioAtivoChave: string | null },
  agora: Date,
): boolean {
  if (agendamento.estagiarioAtivoChave === null) return false;
  return agendamento.status !== "PENDENTE" || agendamento.prazoConfirmacao > agora;
}

export function turnoDoHorario(horaInicio: number): Turno {
  return horaInicio < INICIO_DA_TARDE ? "MANHA" : "TARDE";
}

export function rotuloDoTurno(turno: Turno): string {
  return TURNOS.find((opcao) => opcao.valor === turno)?.rotulo ?? turno;
}

export function horariosDaGrade(grade: Grade): number[] {
  const horarios: number[] = [];
  for (let hora = grade.horaAbertura; hora < grade.horaFechamento; hora += grade.duracaoBlocoMin) {
    if (horarioNaGrade(grade, hora)) horarios.push(hora);
  }
  return horarios;
}

export function chaveEstagiario(estagiarioId: string, diaSemana: number, horaInicio: number): string {
  return `${estagiarioId}:${diaSemana}:${horaInicio}`;
}

export function pendenteVencendo(agendamento: { status: StatusAgendamento; prazoConfirmacao: Date }, agora: Date, horas = 12): boolean {
  if (agendamento.status !== "PENDENTE") return false;
  const restante = agendamento.prazoConfirmacao.getTime() - agora.getTime();
  return restante > 0 && restante <= horas * 60 * 60 * 1000;
}

export function prazoDeConfirmacao(agora: Date): Date {
  return new Date(agora.getTime() + PRAZO_CONFIRMACAO_HORAS * 60 * 60 * 1000);
}

export function chaveSala(salaId: string, diaSemana: number, horaInicio: number): string {
  return `${salaId}:${diaSemana}:${horaInicio}`;
}

export function hojeNoBrasil(agora: Date): Date {
  const data = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_HORARIO }).format(agora);
  return new Date(`${data}T00:00:00Z`);
}

export function primeiraDataNoDia(diaSemana: number, aPartirDe: Date): Date {
  const diferenca = (diaSemana - aPartirDe.getUTCDay() + 7) % 7;
  return new Date(aPartirDe.getTime() + diferenca * UM_DIA_MS);
}

export function horarioNaGrade(unidade: Grade, horaInicio: number): boolean {
  return (
    horaInicio >= unidade.horaAbertura &&
    horaInicio + unidade.duracaoBlocoMin <= unidade.horaFechamento &&
    (horaInicio - unidade.horaAbertura) % unidade.duracaoBlocoMin === 0
  );
}

export function formatarHora(minutos: number): string {
  const horas = String(Math.floor(minutos / 60)).padStart(2, "0");
  return `${horas}:${String(minutos % 60).padStart(2, "0")}`;
}
