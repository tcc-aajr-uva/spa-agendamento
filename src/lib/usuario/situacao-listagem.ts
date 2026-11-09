import { z } from "zod";

export const situacaoListagemUsuarioSchema = z.enum([
  "ATIVOS",
  "INATIVOS",
  "TODOS",
  "SEM_CONVITE",
  "CONVITE_PENDENTE",
  "CONVITE_EXPIRADO",
  "CONVITE_REVOGADO",
]).catch("TODOS");

export type SituacaoListagemUsuario = z.output<typeof situacaoListagemUsuarioSchema>;

export const OPCOES_SITUACAO_USUARIO: { value: SituacaoListagemUsuario; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ATIVOS", label: "Ativos" },
  { value: "INATIVOS", label: "Inativos" },
  { value: "SEM_CONVITE", label: "Sem convite" },
  { value: "CONVITE_PENDENTE", label: "Convite pendente" },
  { value: "CONVITE_EXPIRADO", label: "Convite expirado" },
  { value: "CONVITE_REVOGADO", label: "Convite revogado" },
];
