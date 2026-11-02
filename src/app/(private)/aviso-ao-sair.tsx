"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PERGUNTA = "Você já enviou o link de cancelamento ao paciente? Ele não será mostrado de novo.";
const ALVOS_DE_SAIDA = "a[href], [data-aviso-saida]";

export function AvisoAoSair() {
  const [saida, setSaida] = useState<HTMLElement | null>(null);
  const liberado = useRef(false);

  useEffect(() => {
    function aoFecharPagina(evento: BeforeUnloadEvent) {
      if (!liberado.current) evento.preventDefault();
    }

    function aoClicar(evento: MouseEvent) {
      if (liberado.current || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
      const alvo = evento.target instanceof Element ? evento.target.closest(ALVOS_DE_SAIDA) : null;
      if (!(alvo instanceof HTMLElement)) return;
      evento.preventDefault();
      evento.stopPropagation();
      setSaida(alvo);
    }

    window.addEventListener("beforeunload", aoFecharPagina);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", aoFecharPagina);
      document.removeEventListener("click", aoClicar, true);
    };
  }, []);

  function sair() {
    liberado.current = true;
    setSaida(null);
    saida?.click();
  }

  return (
    <AlertDialog open={saida !== null} onOpenChange={(aberto) => !aberto && setSaida(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair desta tela?</AlertDialogTitle>
          <AlertDialogDescription>{PERGUNTA}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ficar na tela</AlertDialogCancel>
          <AlertDialogAction onClick={sair}>Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
