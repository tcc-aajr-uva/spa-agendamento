"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  conflito: boolean;
  isDirty: boolean;
  ocupado: boolean;
  recarregando: boolean;
  carregarVersao: () => void;
  erroSalvar?: string;
  erroAtivacao?: string;
  erroVersao?: string;
};

export function AlertasFormularioUsuario({ conflito, isDirty, ocupado, recarregando, carregarVersao, erroSalvar, erroAtivacao, erroVersao }: Props) {
  if (!conflito && !erroSalvar && !erroAtivacao && !erroVersao) return null;

  return (
    <div className="space-y-3">
      {erroVersao && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar o usuário</AlertTitle>
          <AlertDescription>{erroVersao}</AlertDescription>
        </Alert>
      )}
      {conflito && (
        <Alert className="has-data-[slot=alert-action]:pr-2.5 sm:has-data-[slot=alert-action]:pr-32" variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Usuário alterado em outra sessão</AlertTitle>
          <AlertDescription>
            <p>
              O usuário foi atualizado depois que você abriu esta tela.
              <br />
              {isDirty ? "Ao carregar a versão mais recente, seu rascunho será descartado." : "Carregue a versão mais recente para continuar."}
            </p>
          </AlertDescription>
          <AlertAction className="static col-span-2 mt-2 flex justify-end sm:absolute sm:top-1/2 sm:right-2 sm:mt-0 sm:-translate-y-1/2">
            <Button className="h-auto max-w-full rounded-sm px-4 py-2 whitespace-normal" variant="outline" type="button"
              disabled={ocupado || recarregando} onClick={carregarVersao}>
              {recarregando ? "Carregando…" : "Carregar"}
            </Button>
          </AlertAction>
        </Alert>
      )}
      {erroSalvar && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar o usuário</AlertTitle>
          <AlertDescription>{erroSalvar}</AlertDescription>
        </Alert>
      )}
      {erroAtivacao && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível alterar a situação</AlertTitle>
          <AlertDescription>{erroAtivacao}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
