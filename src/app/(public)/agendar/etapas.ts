import { ClipboardList, Clock, MapPin, Users, type LucideIcon } from "lucide-react";

export type Etapa = { rotulo: string; descricao: string; icone: LucideIcon };

export const ETAPAS: readonly Etapa[] = [
  { rotulo: "Unidade", descricao: "Escolha a unidade do SPA mais perto de você.", icone: MapPin },
  { rotulo: "Atendimento", descricao: "Selecione o tipo de atendimento que procura.", icone: Users },
  { rotulo: "Horário", descricao: "Veja os horários livres e escolha o melhor para você.", icone: Clock },
  { rotulo: "Seus dados", descricao: "Preencha a inscrição e receba o código do agendamento.", icone: ClipboardList },
];

export type Selecao = { unidade?: string; equipe?: string };

export function linkDaEtapa(indice: number, { unidade, equipe }: Selecao): string {
  const busca = new URLSearchParams();
  if (indice >= 1 && unidade) busca.set("unidade", unidade);
  if (indice >= 2 && equipe) busca.set("equipe", equipe);
  const consulta = busca.toString();
  return consulta ? `/agendar?${consulta}` : "/agendar";
}
