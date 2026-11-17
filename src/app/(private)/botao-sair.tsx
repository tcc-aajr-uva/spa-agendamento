"use client";

import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";

export function BotaoSair({ className }: { className?: string }) {
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function sair() {
    setErro(null);
    setSaindo(true);
    try {
      const resultado = await signOut();
      if (resultado.error) {
        falhar();
        return;
      }

      window.location.replace("/entrar");
    } catch {
      falhar();
    }
  }

  function falhar() {
    setErro("Não foi possível sair. Tente novamente.");
    setSaindo(false);
  }

  return (
    <div className="relative">
      <Button
        className={className}
        variant="outline"
        disabled={saindo}
        aria-busy={saindo}
        onClick={sair}
        type="button"
        data-aviso-saida
      >
        {saindo ? (
          <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />
        ) : (
          <LogOutIcon data-icon="inline-start" aria-hidden className="size-4" />
        )}
        Sair
        <span className="sr-only" aria-live="polite">
          {saindo ? "Saindo…" : ""}
        </span>
      </Button>
      {erro && (
        <p
          className="absolute top-full right-0 z-10 mt-2 w-max max-w-64 rounded-md border bg-popover px-3 py-2 text-sm text-destructive shadow-md"
          aria-live="polite"
        >
          {erro}
        </p>
      )}
    </div>
  );
}
