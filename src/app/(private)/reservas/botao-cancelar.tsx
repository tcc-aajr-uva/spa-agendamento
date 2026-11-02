"use client";

import { useActionState, useState } from "react";
import { cancelarReserva } from "./actions";

export function BotaoCancelarReserva({ agendamentoId, descricao }: { agendamentoId: string; descricao: string }) {
  const [estado, enviar, enviando] = useActionState(cancelarReserva, {});
  const [confirmando, setConfirmando] = useState(false);

  return (
    <form action={enviar} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="agendamentoId" value={agendamentoId} />
      {confirmando ? (
        <>
          <button disabled={enviando} className="rounded border border-red-400 px-2 text-sm text-red-400">
            {enviando ? "Cancelando…" : `Confirmar cancelamento de ${descricao}`}
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className="rounded border px-2 text-sm">
            Voltar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmando(true)} aria-label={`Cancelar ${descricao}`} className="rounded border px-2 text-sm">
          Cancelar
        </button>
      )}
      {estado.erro && (
        <span role="alert" className="text-sm text-red-400">
          {estado.erro}
        </span>
      )}
    </form>
  );
}
