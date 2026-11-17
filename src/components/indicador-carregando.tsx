import { Loader2Icon } from "lucide-react";

export function IndicadorCarregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-2 text-sm text-muted-foreground animate-in duration-300 ease-out fade-in delay-150 fill-mode-both">
      <Loader2Icon aria-hidden className="size-4 animate-spin" />
      {texto}
    </div>
  );
}
