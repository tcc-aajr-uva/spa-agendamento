"use client";

import { CircleAlertIcon } from "lucide-react";

import { AlertaConflito } from "@/components/alerta-conflito";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        <AlertaConflito
          titulo="Unidade alterada em outra sessão"
          descricao="A unidade foi atualizada depois que você abriu esta tela."
          carregando={atualizandoVersao}
          onCarregar={onCarregarVersao}
        />
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
