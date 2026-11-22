import { z } from "zod";

import type { StatusSolicitacaoAcesso } from "@/generated/prisma/client";

export const situacaoSolicitacaoSchema = z.enum(["PENDENTES", "RECUSADAS", "APROVADAS", "TODAS"]).catch("PENDENTES");

export type SituacaoSolicitacao = z.output<typeof situacaoSolicitacaoSchema>;

export const SITUACAO_PADRAO_SOLICITACAO: SituacaoSolicitacao = "PENDENTES";

export const OPCOES_SITUACAO_SOLICITACAO: { value: SituacaoSolicitacao; label: string }[] = [
  { value: "PENDENTES", label: "Pendentes" },
  { value: "RECUSADAS", label: "Recusadas" },
  { value: "APROVADAS", label: "Aprovadas" },
  { value: "TODAS", label: "Todas" },
];

export const STATUS_DA_SITUACAO: Record<SituacaoSolicitacao, StatusSolicitacaoAcesso | undefined> = {
  PENDENTES: "PENDENTE",
  RECUSADAS: "RECUSADA",
  APROVADAS: "APROVADA",
  TODAS: undefined,
};

const ROTULOS_STATUS: Record<StatusSolicitacaoAcesso, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
};

export function rotuloDoStatusSolicitacao(status: StatusSolicitacaoAcesso): string {
  return ROTULOS_STATUS[status];
}
