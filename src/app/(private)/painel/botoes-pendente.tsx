"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { liberarPendente, type EstadoAcao } from "./actions";

const estadoInicial: EstadoAcao = { erro: null };

export function BotoesPendente({ agendamentoId }: { agendamentoId: string }) {
  const [estado, acao, enviando] = useActionState(liberarPendente, estadoInicial);

  return (
    <form action={acao} className="flex flex-col items-end gap-1">
      <input type="hidden" name="agendamentoId" value={agendamentoId} />
      <div className="flex gap-2">
        <Button type="button" disabled title="Disponível quando a confirmação estiver pronta">
          Confirmar
        </Button>
        <Button
          type="submit"
          variant="outline"
          disabled={enviando}
          className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          {enviando && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
          {enviando ? "Liberando…" : "Liberar"}
        </Button>
      </div>
      {estado.erro && (
        <p role="alert" className="text-sm text-destructive">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
