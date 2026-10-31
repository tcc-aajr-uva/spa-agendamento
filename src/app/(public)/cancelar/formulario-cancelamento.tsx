"use client";

import { useActionState } from "react";
import { cancelarAgendamentoAction, type EstadoCancelamento } from "./actions";

const estadoInicial: EstadoCancelamento = { status: "inicial" };

export function FormularioCancelamento({ token }: { token: string }) {
  const [estado, formAction, pendente] = useActionState(cancelarAgendamentoAction, estadoInicial);

  if (estado.status === "sucesso") {
    return <p role="status" className="mt-4">Agendamento cancelado. O horário foi liberado.</p>;
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1">
        Código de cancelamento
        <input
          name="codigo"
          required
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          className="rounded border p-2 uppercase tracking-widest"
        />
      </label>
      {estado.status === "erro" && (
        <p role="alert" className="text-red-600">{estado.mensagem}</p>
      )}
      <button type="submit" disabled={pendente} className="rounded bg-red-600 p-2 text-white disabled:opacity-50">
        {pendente ? "Cancelando…" : "Cancelar agendamento"}
      </button>
    </form>
  );
}