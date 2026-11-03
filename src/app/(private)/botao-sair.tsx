"use client";

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
    <div className="space-y-1">
      <Button className={className} variant="outline" disabled={saindo} onClick={sair} type="button" data-aviso-saida>
        {saindo ? "Saindo…" : "Sair"}
      </Button>
      {erro && (
        <p className="text-sm text-destructive" aria-live="polite">
          {erro}
        </p>
      )}
    </div>
  );
}
