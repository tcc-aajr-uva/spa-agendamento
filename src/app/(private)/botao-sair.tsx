"use client";

import { useState } from "react";

import { signOut } from "@/lib/auth/client";

export function BotaoSair() {
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
      <button className="rounded border px-2 py-1 text-sm" disabled={saindo} onClick={sair} type="button">
        {saindo ? "Saindo…" : "Sair"}
      </button>
      {erro && (
        <p className="text-sm text-red-700" aria-live="polite">
          {erro}
        </p>
      )}
    </div>
  );
}
