"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Home, Loader2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatarCpf } from "@/lib/paciente/mascaras";
import { TAMANHO_CODIGO } from "@/lib/token-constantes";
import { cancelarAgendamentoAction, cancelarPorCpfAction, type EstadoCancelamento } from "./actions";

const estadoInicial: EstadoCancelamento = { status: "inicial" };

export function FormularioCancelamento({ token }: { token?: string }) {
  const [estado, formAction, pendente] = useActionState(token ? cancelarAgendamentoAction : cancelarPorCpfAction, estadoInicial);

  if (estado.status === "sucesso") return <Sucesso />;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {token ? (
        <input type="hidden" name="token" value={token} />
      ) : (
        <Field>
          <FieldLabel htmlFor="cancelar-cpf">CPF do paciente</FieldLabel>
          <Input
            id="cancelar-cpf"
            name="cpf"
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder="000.000.000-00"
            className="h-10 px-3"
            onChange={(evento) => {
              evento.target.value = formatarCpf(evento.target.value);
            }}
          />
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor="cancelar-codigo">Código do agendamento</FieldLabel>
        <Input
          id="cancelar-codigo"
          name="codigo"
          required
          maxLength={TAMANHO_CODIGO}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="X7K2PQ"
          className="h-10 px-3 font-mono uppercase tracking-widest"
        />
      </Field>
      {estado.status === "erro" && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" variant="destructive" size="lg" disabled={pendente} className="h-11 text-base">
        {pendente && <Loader2Icon data-icon="inline-start" aria-hidden className="animate-spin" />}
        {pendente ? "Cancelando…" : "Cancelar agendamento"}
      </Button>
    </form>
  );
}

function Sucesso() {
  return (
    <div className="flex flex-col items-center gap-3 text-center animate-in fade-in-0 zoom-in-95 duration-300 ease-out">
      <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-sucesso/15 text-sucesso">
        <CheckCircle2 className="size-8" />
      </span>
      <p className="text-xl font-semibold">Agendamento cancelado</p>
      <p className="text-muted-foreground" role="status">
        O horário foi liberado. Se quiser, você pode fazer um novo agendamento.
      </p>
      <Button variant="ghost" size="lg" nativeButton={false} render={<Link href="/" />}>
        <Home />
        Voltar ao início
      </Button>
    </div>
  );
}
