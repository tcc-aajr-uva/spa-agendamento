"use client";

import { Button } from "@/components/ui/button";

export default function ErroEquipes({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-4" role="alert">
      <h1 className="text-xl font-bold">Não foi possível carregar as equipes</h1>
      <p className="text-muted-foreground">Tente novamente em instantes.</p>
      <Button onClick={reset} type="button">Tentar novamente</Button>
    </section>
  );
}
