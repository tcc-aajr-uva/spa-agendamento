"use client";

import { Loader2Icon } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function BotaoFiltrar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
      {pending ? "Filtrando…" : "Filtrar"}
    </Button>
  );
}
