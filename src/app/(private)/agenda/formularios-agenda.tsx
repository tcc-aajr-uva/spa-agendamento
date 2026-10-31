"use client";

import { useActionState } from "react";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { adicionarHorario, removerHorario } from "./actions";

export function FormularioNovoHorario({ dias, horas }: { dias: number[]; horas: number[] }) {
  const [estado, enviar, enviando] = useActionState(adicionarHorario, {});

  return (
    <form action={enviar} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        Dia
        <select name="diaSemana" required className="rounded border bg-transparent px-2 py-1">
          {dias.map((dia) => (
            <option key={dia} value={dia}>
              {DIAS_DA_SEMANA[dia]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Horário
        <select name="horaInicio" required className="rounded border bg-transparent px-2 py-1">
          {horas.map((hora) => (
            <option key={hora} value={hora}>
              {formatarHora(hora)}
            </option>
          ))}
        </select>
      </label>
      <button disabled={enviando} className="rounded border px-3 py-1">
        {enviando ? "Salvando…" : "Adicionar horário"}
      </button>
      <p aria-live="polite" className={`w-full ${estado.erro ? "text-red-400" : ""}`}>
        {estado.erro ?? estado.mensagem}
      </p>
    </form>
  );
}

export function BotaoRemoverHorario({ horarioId, descricao }: { horarioId: string; descricao: string }) {
  const [estado, enviar, enviando] = useActionState(removerHorario, {});

  return (
    <form action={enviar} className="inline">
      <input type="hidden" name="horarioId" value={horarioId} />
      <button disabled={enviando} aria-label={`Remover ${descricao}`} className="rounded border px-2 text-sm">
        {enviando ? "…" : "Remover"}
      </button>
      {estado.erro && (
        <span role="alert" className="ml-2 text-sm text-red-400">
          {estado.erro}
        </span>
      )}
    </form>
  );
}
