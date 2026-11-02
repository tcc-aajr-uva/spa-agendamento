"use client";

import { useActionState, useId } from "react";
import type { DatasPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { EstadoPeriodo } from "./actions";

export function ControleExclusaoPeriodo({ acao, valores, motivosBloqueio }: {
  acao: (estado: EstadoPeriodo, formData: FormData) => Promise<EstadoPeriodo>; valores: DatasPeriodo; motivosBloqueio: string[];
}) {
  const [estado, excluir, excluindo] = useActionState(acao, {});
  const descricaoId = useId();
  const bloqueado = motivosBloqueio.length > 0;
  return (
    <form action={excluir} className="space-y-3 rounded border p-4" onSubmit={(evento) => {
      if (bloqueado) {
        evento.preventDefault();
        return;
      }
      if (!window.confirm("Excluir este período letivo? Esta ação não pode ser desfeita.")) evento.preventDefault();
    }}>
      <h2 className="font-semibold">Excluir período</h2>
      <p className="text-sm text-gray-600">Somente períodos futuros sem configurações de atendimento nem agendamentos podem ser excluídos.</p>
      {bloqueado && (
        <div id={descricaoId} className="space-y-1 text-sm text-gray-600">
          <p>A exclusão está bloqueada pelos seguintes motivos:</p>
          <ul className="list-disc space-y-1 pl-5">
            {motivosBloqueio.map((motivo) => <li key={motivo}>{motivo}</li>)}
          </ul>
        </div>
      )}
      <input type="hidden" name="versao" value={JSON.stringify(valores)} />
      <button className="rounded border px-3 py-2 text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        type="submit" disabled={excluindo || bloqueado} aria-describedby={bloqueado ? descricaoId : undefined}>
        {excluindo ? "Excluindo…" : "Excluir período"}
      </button>
      {estado.erro && <p className="text-sm text-red-700" role="alert">{estado.erro}</p>}
    </form>
  );
}
