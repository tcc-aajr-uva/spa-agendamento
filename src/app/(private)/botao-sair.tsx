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
        setErro("Não foi possível sair. Tente novamente.");
        return;
      }

      window.location.replace("/entrar");
    } catch {
      setErro("Não foi possível sair. Tente novamente.");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button className={className} variant="outline" disabled={saindo} onClick={sair} type="button">
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
