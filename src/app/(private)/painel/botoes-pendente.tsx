"use client";

import { useActionState } from "react";

import { liberarPendente, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { erro: null };

export function BotoesPendente({ agendamentoId }: { agendamentoId: string }) {
  const [estado, acao, enviando] = useActionState(liberarPendente, estadoInicial);

  return (
    <form action={acao} className="flex flex-col items-end gap-1">
      <input type="hidden" name="agendamentoId" value={agendamentoId} />
      <div className="flex gap-2">
        <button
          type="button"
          disabled
          title="Disponível quando a confirmação estiver pronta"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Confirmar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {enviando ? "Liberando…" : "Liberar"}
        </button>
      </div>
      {estado.erro && (
        <p role="alert" className="text-sm text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}