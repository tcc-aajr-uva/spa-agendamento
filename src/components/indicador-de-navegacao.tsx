"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const LIMITE_MS = 10_000;

function destinoInterno(evento: MouseEvent): string | null {
  if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return null;
  const link = evento.target instanceof Element ? evento.target.closest("a[href]") : null;
  if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return null;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  const destino = url.pathname + url.search;
  return destino === window.location.pathname + window.location.search ? null : destino;
}

function Indicador() {
  const caminho = usePathname();
  const busca = useSearchParams().toString();
  const [navegando, setNavegando] = useState(false);
  const [rotaAtual, setRotaAtual] = useState(`${caminho}?${busca}`);

  if (rotaAtual !== `${caminho}?${busca}`) {
    setRotaAtual(`${caminho}?${busca}`);
    setNavegando(false);
  }

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      if (destinoInterno(evento)) setNavegando(true);
    }
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    if (!navegando) return;
    raiz.dataset.navegando = "";
    const limite = window.setTimeout(() => setNavegando(false), LIMITE_MS);
    return () => {
      delete raiz.dataset.navegando;
      window.clearTimeout(limite);
    };
  }, [navegando]);

  if (!navegando) return null;

  return (
    <span aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-secondary/30">
      <span className="block h-full w-1/3 animate-carregar-barra bg-secondary" />
    </span>
  );
}

export function IndicadorDeNavegacao() {
  return (
    <Suspense fallback={null}>
      <Indicador />
    </Suspense>
  );
}
