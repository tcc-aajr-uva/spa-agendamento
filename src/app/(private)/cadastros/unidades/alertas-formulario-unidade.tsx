"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  atualizandoVersao: boolean;
  mensagemErroVersao?: string;
  mensagensErrosGerais?: string[];
  onCarregarVersao: () => void;
  possuiConflito: boolean;
};

export function AlertasFormularioUnidade({
  atualizandoVersao,
  mensagemErroVersao,
  mensagensErrosGerais = [],
  onCarregarVersao,
  possuiConflito,
}: Props) {
  if (!mensagensErrosGerais.length && !mensagemErroVersao && !possuiConflito) return null;

  return (
    <div className="space-y-3">
      {mensagemErroVersao && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar a unidade</AlertTitle>
          <AlertDescription>{mensagemErroVersao}</AlertDescription>
        </Alert>
      )}

      {possuiConflito && (
        <Alert className="has-data-[slot=alert-action]:pr-2.5 sm:has-data-[slot=alert-action]:pr-32" variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Unidade alterada em outra sessão</AlertTitle>
          <AlertDescription>
            <p>
              A unidade foi atualizada depois que você abriu esta tela.
              <br />
              Carregue a versão mais recente para continuar.
            </p>
          </AlertDescription>
          <AlertAction className="static col-span-2 mt-2 flex justify-end sm:absolute sm:top-1/2 sm:right-2 sm:mt-0 sm:-translate-y-1/2">
            <Button
              className="h-auto max-w-full rounded-sm px-4 py-2 whitespace-normal"
              disabled={atualizandoVersao}
              variant="outline"
              onClick={onCarregarVersao}
              type="button"
            >
              {atualizandoVersao
                ? "Carregando…"
                : "Carregar"}
            </Button>
          </AlertAction>
        </Alert>
      )}

      {mensagensErrosGerais.map((mensagem, indice) => (
        <Alert key={`${indice}-${mensagem}`} variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível concluir a operação</AlertTitle>
          <AlertDescription>{mensagem}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
