"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type EstadoReserva, remarcarReserva } from "./actions";

type HorarioLivre = { id: string; descricao: string };

export function BotaoRemarcarReserva({ agendamentoId, descricao, horarios }: { agendamentoId: string; descricao: string; horarios: HorarioLivre[] }) {
  const [aberto, setAberto] = useState(false);
  const [estado, enviar, enviando] = useActionState(async (anterior: EstadoReserva, formData: FormData) => {
    const resultado = await remarcarReserva(anterior, formData);
    if (resultado.mensagem) setAberto(false);
    return resultado;
  }, {});

  if (!aberto) {
    return (
      <>
        <button type="button" onClick={() => setAberto(true)} aria-label={`Remarcar ${descricao}`} className="rounded border px-2 text-sm">
          Remarcar
        </button>
        <span aria-live="polite" className="text-sm">
          {estado.mensagem}
        </span>
      </>
    );
  }

  return (
    <form action={enviar} className="flex w-full flex-wrap items-end gap-3">
      <input type="hidden" name="agendamentoId" value={agendamentoId} />
      <fieldset className="flex flex-col gap-1">
        <legend>Vale para</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="alcance" value="todas" defaultChecked />
          Todas as semanas
        </label>
        <label className="flex items-center gap-2 opacity-60">
          <input type="radio" name="alcance" value="uma" disabled />
          Só esta semana (em breve)
        </label>
      </fieldset>
      {horarios.length === 0 ? (
        <p className="text-sm">
          Você não tem outro horário livre. Adicione um em{" "}
          <Link href="/agenda" className="underline">
            Minha agenda
          </Link>
          .
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1">
            Novo horário
            <select name="horarioId" required className="rounded border bg-transparent px-2 py-1">
              {horarios.map((horario) => (
                <option key={horario.id} value={horario.id}>
                  {horario.descricao}
                </option>
              ))}
            </select>
          </label>
          <button disabled={enviando} className="rounded border px-2 text-sm">
            {enviando ? "Salvando…" : `Salvar remarcação de ${descricao}`}
          </button>
        </>
      )}
      <button type="button" onClick={() => setAberto(false)} className="rounded border px-2 text-sm">
        Voltar
      </button>
      {estado.erro && (
        <span role="alert" className="text-sm text-red-400">
          {estado.erro}
        </span>
      )}
    </form>
  );
}
