"use client";

import { useEffect, useState } from "react";

export function MensagemSucesso({ texto }: { texto: string }) {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setVisivel(false), 5_000);
    return () => window.clearTimeout(temporizador);
  }, []);

  if (!visivel) return null;
  return <p className="text-sm text-green-700" aria-live="polite">{texto}</p>;
}
