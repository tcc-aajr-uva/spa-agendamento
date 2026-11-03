"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ErroDeTela({ titulo, reset }: { titulo: string; reset: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Alert variant="destructive">
        <AlertTitle>{titulo}</AlertTitle>
        <AlertDescription>Tente novamente em instantes.</AlertDescription>
      </Alert>
      <Button variant="outline" className="self-start" onClick={reset} type="button">
        Tentar novamente
      </Button>
    </section>
  );
}
