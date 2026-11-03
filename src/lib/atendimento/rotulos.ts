import type { MotivoEncerramento, Presenca, StatusAgendamento, TipoEvento } from "@/generated/prisma/client";

type VarianteDeStatus = "default" | "secondary" | "accent" | "outline";

const STATUS: Record<StatusAgendamento, { rotulo: string; variante: VarianteDeStatus }> = {
  PENDENTE: { rotulo: "Pendente", variante: "secondary" },
  CONFIRMADO: { rotulo: "Confirmado", variante: "default" },
  EM_ATENDIMENTO: { rotulo: "Em atendimento", variante: "accent" },
  ENCERRADO: { rotulo: "Encerrado", variante: "outline" },
  CANCELADO: { rotulo: "Cancelado", variante: "outline" },
};

export function statusDoAgendamento(status: StatusAgendamento) {
  return STATUS[status];
}

const ROTULOS_MOTIVO: Record<MotivoEncerramento, string> = {
  NAO_CONFIRMADO: "Não confirmado",
  NAO_LOCALIZADO: "Não localizado / contato inexistente",
  DESISTENCIA: "Desistência",
  FALTA_PRIMEIRA_SESSAO: "Falta na 1ª sessão",
  TRES_FALTAS: "3 faltas seguidas",
  CANCELADO_PELO_PACIENTE: "Cancelado pelo paciente",
  CANCELADO_PELO_ESTAGIARIO: "Cancelado pelo estagiário",
  TRANSFERENCIA: "Transferência",
  ALTA: "Alta",
  FIM_DO_PERIODO: "Fim do período letivo",
};

export function rotuloDoMotivo(motivo: MotivoEncerramento): string {
  return ROTULOS_MOTIVO[motivo];
}

const ROTULOS_PRESENCA: Record<Presenca, string> = {
  PRESENTE: "Presente",
  FALTA: "Falta sem aviso",
  FALTA_JUSTIFICADA: "Falta justificada",
};

export function rotuloDaPresenca(presenca: Presenca): string {
  return ROTULOS_PRESENCA[presenca];
}

export const OPCOES_DE_PRESENCA = Object.entries(ROTULOS_PRESENCA).map(([value, label]) => ({ value, label }));

const ROTULOS_EVENTO: Record<TipoEvento, string> = {
  CRIADO: "Criado",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  REMARCADO: "Remarcado",
  FALTA: "Falta",
  TERMO_ASSINADO: "Termo assinado",
  TRANSFERIDO: "Transferido",
  ENCERRADO: "Encerrado",
  LINK_CANCELAMENTO_GERADO: "Link de cancelamento gerado",
};

export function rotuloDoEvento(tipo: TipoEvento): string {
  return ROTULOS_EVENTO[tipo];
}
