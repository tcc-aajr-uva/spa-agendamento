import { DIAS_DA_SEMANA, FUSO_HORARIO, formatarHora } from "@/lib/agendamento/regras";
import { BotoesPendente } from "./botoes-pendente";

type Pendente = {
  id: string;
  diaSemana: number;
  horaInicio: number;
  prazoConfirmacao: Date;
  paciente: { nome: string };
  sala: { nome: string };
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_HORARIO, day: "2-digit", month: "2-digit" });
const formatoHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_HORARIO, hour: "2-digit", minute: "2-digit" });

function formatarPrazo(prazo: Date): string {
  return `até ${formatoData.format(prazo)}, ${formatoHora.format(prazo)}`;
}

export function ListaPendentes({ pendentes }: { pendentes: Pendente[] }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Pendentes perto de vencer</h2>
      {pendentes.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pendente perto de vencer.</p>
      ) : (
        <ul className="divide-y">
          {pendentes.map((pendente) => (
            <li key={pendente.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{pendente.paciente.nome}</p>
                <p className="text-muted-foreground">
                  {DIAS_DA_SEMANA[pendente.diaSemana]}, {formatarHora(pendente.horaInicio)} · {pendente.sala.nome}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-destructive">{formatarPrazo(pendente.prazoConfirmacao)}</span>
                <BotoesPendente agendamentoId={pendente.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}