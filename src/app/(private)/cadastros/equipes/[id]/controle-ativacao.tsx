"use client";

import { useId, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  executar: (formData: FormData) => void;
  executando: boolean;
  ativa: boolean;
  atualizadoEm: string;
  bloqueado: boolean;
  bloqueadoPorRascunho: boolean;
};

export function ControleAtivacaoEquipe({ executar, executando, ativa, atualizadoEm, bloqueado, bloqueadoPorRascunho }: Props) {
  const [versaoDaConfirmacao, definirVersaoDaConfirmacao] = useState<string | null>(null);
  const formularioId = useId();
  const confirmacaoAberta = ativa && !bloqueado && !executando && versaoDaConfirmacao === atualizadoEm;

  return (
    <form id={formularioId} action={executar} onSubmit={(evento) => {
      if (bloqueado || executando || (ativa && !confirmacaoAberta)) evento.preventDefault();
      definirVersaoDaConfirmacao(null);
    }}>
      <input type="hidden" name="atualizadoEm" value={confirmacaoAberta ? versaoDaConfirmacao : atualizadoEm} />
      <input type="hidden" name="operacao" value={ativa ? "INATIVAR" : "ATIVAR"} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Situação da equipe</h2></CardTitle>
          <CardDescription>
            {ativa
              ? "A inativação retira a equipe dos fluxos ativos e preserva os vínculos e agendamentos existentes, sem cancelá-los automaticamente."
              : "A ativação torna a equipe novamente disponível nos fluxos do sistema."}
            {bloqueadoPorRascunho && (
              <span className="mt-2 block">
                Salve ou desfaça as alterações no formulário para mudar a situação da equipe.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          {ativa ? (
            <AlertDialog open={confirmacaoAberta}
              onOpenChange={(aberta) => definirVersaoDaConfirmacao(aberta ? atualizadoEm : null)}>
              <AlertDialogTrigger render={<Button variant="destructive" disabled={bloqueado} type="button" />}>
                {executando ? "Processando…" : "Inativar equipe"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Inativar esta equipe?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ela deixará de aparecer nos fluxos ativos. Os vínculos e agendamentos existentes serão preservados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={!confirmacaoAberta}>
                    Inativar equipe
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={bloqueado} type="submit">
              {executando ? "Processando…" : "Ativar equipe"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
