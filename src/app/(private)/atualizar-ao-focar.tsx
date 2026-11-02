"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function AtualizarAoFocar() {
  const router = useRouter();
  const ultimaAtualizacao = useRef(0);

  const atualizar = useCallback(() => {
    const agora = Date.now();
    if (agora - ultimaAtualizacao.current < 500) return;
    ultimaAtualizacao.current = agora;
    router.refresh();
  }, [router]);

  useEffect(() => {
    const atualizarQuandoVisivel = () => {
      if (document.visibilityState === "visible") atualizar();
    };

    window.addEventListener("focus", atualizar);
    document.addEventListener("visibilitychange", atualizarQuandoVisivel);
    return () => {
      window.removeEventListener("focus", atualizar);
      document.removeEventListener("visibilitychange", atualizarQuandoVisivel);
    };
  }, [atualizar]);

  return null;
}
