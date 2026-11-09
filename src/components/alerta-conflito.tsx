"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  titulo: string;
  descricao: string;
  carregando: boolean;
  bloqueado?: boolean;
  onCarregar: () => void;
};

export function AlertaConflito({ titulo, descricao, carregando, bloqueado = false, onCarregar }: Props) {
  return (
    <Alert className="has-data-[slot=alert-action]:pr-2.5 sm:has-data-[slot=alert-action]:pr-32" variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>
        <p>
          {descricao}
          <br />
          Carregue a versão mais recente para continuar.
        </p>
      </AlertDescription>
      <AlertAction className="static col-span-2 mt-2 flex justify-end sm:absolute sm:top-1/2 sm:right-2 sm:mt-0 sm:-translate-y-1/2">
        <Button
          className="h-auto max-w-full rounded-sm px-4 py-2 whitespace-normal"
          variant="outline"
          type="button"
          disabled={bloqueado || carregando}
          onClick={onCarregar}
        >
          {carregando ? "Carregando…" : "Carregar"}
        </Button>
      </AlertAction>
    </Alert>
  );
}
