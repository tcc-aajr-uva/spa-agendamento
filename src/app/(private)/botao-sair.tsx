"use client";

import { useState } from "react";

import { signOut } from "@/lib/auth/client";

export function BotaoSair() {
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    try {
      const resultado = await signOut();
      if (resultado.error) return;

      window.location.replace("/entrar");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <button className="rounded border px-2 py-1 text-sm" disabled={saindo} onClick={sair} type="button">
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
