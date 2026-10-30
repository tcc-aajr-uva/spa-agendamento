"use client";

import { useEffect } from "react";

const PERGUNTA = "Você já enviou o link de cancelamento ao paciente? Ele não será mostrado de novo.";
const ALVOS_DE_SAIDA = "a[href], nav button";

export function AvisoAoSair() {
  useEffect(() => {
    function aoFecharPagina(evento: BeforeUnloadEvent) {
      evento.preventDefault();
    }

    function aoClicar(evento: MouseEvent) {
      const saida = evento.target instanceof Element && evento.target.closest(ALVOS_DE_SAIDA);
      if (!saida || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
      if (window.confirm(PERGUNTA)) return;
      evento.preventDefault();
      evento.stopPropagation();
    }

    window.addEventListener("beforeunload", aoFecharPagina);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", aoFecharPagina);
      document.removeEventListener("click", aoClicar, true);
    };
  }, []);

  return null;
}
