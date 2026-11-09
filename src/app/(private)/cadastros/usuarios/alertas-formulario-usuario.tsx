"use client";

import { CircleAlertIcon } from "lucide-react";

import { AlertaConflito } from "@/components/alerta-conflito";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  conflito: boolean;
  ocupado: boolean;
  recarregando: boolean;
  carregarVersao: () => void;
  erroSalvar?: string;
  erroAtivacao?: string;
  erroVersao?: string;
};

export function AlertasFormularioUsuario({ conflito, ocupado, recarregando, carregarVersao, erroSalvar, erroAtivacao, erroVersao }: Props) {
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
        <AlertaConflito
          titulo="Usuário alterado em outra sessão"
          descricao="O usuário foi atualizado depois que você abriu esta tela."
          carregando={recarregando}
          bloqueado={ocupado}
          onCarregar={carregarVersao}
        />
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
