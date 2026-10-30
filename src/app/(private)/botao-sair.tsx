"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/client";

export function BotaoSair() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button className="rounded border px-2 py-1 text-sm" disabled={saindo} onClick={sair} type="button">
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
