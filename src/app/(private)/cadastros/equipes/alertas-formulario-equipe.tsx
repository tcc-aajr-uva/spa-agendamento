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

export function AlertasFormularioEquipe({ conflito, ocupado, recarregando, carregarVersao, erroSalvar, erroAtivacao, erroVersao }: Props) {
  if (!conflito && !erroSalvar && !erroAtivacao && !erroVersao) return null;

  return (
    <div className="space-y-3">
      {erroVersao && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar a equipe</AlertTitle>
          <AlertDescription>{erroVersao}</AlertDescription>
        </Alert>
      )}
      {conflito && (
        <AlertaConflito
          titulo="Equipe alterada em outra sessão"
          descricao="A equipe foi atualizada depois que você abriu esta tela."
          carregando={recarregando}
          bloqueado={ocupado}
          onCarregar={carregarVersao}
        />
      )}
      {erroSalvar && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar a equipe</AlertTitle>
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
