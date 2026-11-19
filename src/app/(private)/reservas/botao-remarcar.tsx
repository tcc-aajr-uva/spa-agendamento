"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import type { OpcaoDeHorario } from "@/lib/agendamento/opcoes-de-horario";
import { SeletorHorarioSala } from "../seletor-horario-sala";
import { type EstadoReserva, remarcarReserva } from "./actions";

export function BotaoRemarcarReserva({ agendamentoId, descricao, horarios }: { agendamentoId: string; descricao: string; horarios: OpcaoDeHorario[] }) {
  const [aberto, setAberto] = useState(false);
  const [estado, enviar, enviando] = useActionState(async (anterior: EstadoReserva, formData: FormData) => {
    const resultado = await remarcarReserva(anterior, formData);
    if (resultado.mensagem) setAberto(false);
    return resultado;
  }, {});

  if (!aberto) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setAberto(true)} aria-label={`Remarcar ${descricao}`}>
          Remarcar
        </Button>
        <div aria-live="polite" className="order-last basis-full empty:hidden">
          {estado.mensagem && (
            <Alert variant="success">
              <AlertDescription>{estado.mensagem}</AlertDescription>
            </Alert>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="order-last basis-full pt-2">
      <form action={enviar} className="flex flex-col gap-3">
        <input type="hidden" name="agendamentoId" value={agendamentoId} />
        <FieldSet>
          <FieldLegend variant="label">Vale para</FieldLegend>
          <Field orientation="horizontal">
            <input id={`${agendamentoId}-todas`} type="radio" name="alcance" value="todas" defaultChecked className="accent-primary" />
            <FieldLabel htmlFor={`${agendamentoId}-todas`} className="font-normal">Todas as semanas</FieldLabel>
          </Field>
          <Field orientation="horizontal" data-disabled>
            <input id={`${agendamentoId}-uma`} type="radio" name="alcance" value="uma" disabled />
            <FieldLabel htmlFor={`${agendamentoId}-uma`} className="font-normal">Só esta semana (em breve)</FieldLabel>
          </Field>
        </FieldSet>
        {horarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum outro horário com sala disponível e livre.</p>
        ) : (
          <SeletorHorarioSala idBase={`remarcar-${agendamentoId}`} opcoes={horarios} />
        )}
        <div className="flex gap-2">
          {horarios.length > 0 && (
            <Button type="submit" size="sm" disabled={enviando}>
              {enviando && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
              {enviando ? "Salvando…" : "Salvar remarcação"}
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setAberto(false)}>
            Voltar
          </Button>
        </div>
        {estado.erro && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription className="text-destructive">{estado.erro}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
