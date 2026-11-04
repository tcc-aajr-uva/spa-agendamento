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
  ativa: boolean;
  atualizadoEm: string;
  bloqueada: boolean;
  bloqueadaPorRascunho: boolean;
  executar: (formData: FormData) => void;
  executando: boolean;
};

export function ControleAtivacaoUnidade({
  ativa,
  atualizadoEm,
  bloqueada,
  bloqueadaPorRascunho,
  executar,
  executando,
}: Props) {
  const [versaoDaConfirmacao, definirVersaoDaConfirmacao] = useState<string | null>(null);
  const formularioId = useId();
  const confirmacaoAberta =
    ativa && !bloqueada && !executando && versaoDaConfirmacao === atualizadoEm;

  return (
    <form id={formularioId} action={executar} onSubmit={() => definirVersaoDaConfirmacao(null)}>
      <input name="operacao" type="hidden" value={ativa ? "INATIVAR" : "ATIVAR"} />
      <input name="atualizadoEm" type="hidden" value={confirmacaoAberta ? versaoDaConfirmacao : atualizadoEm} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Situação da unidade</h2></CardTitle>
          <CardDescription>
            {ativa
              ? "A inativação preserva os dados existentes, mas remove a unidade dos fluxos ativos."
              : "A ativação torna a unidade novamente disponível nos fluxos do sistema."}
            {bloqueadaPorRascunho && (
              <span className="mt-2 block">
                Salve as alterações da unidade antes de alterar sua situação.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          {ativa ? (
            <AlertDialog
              open={confirmacaoAberta}
              onOpenChange={(aberta) => definirVersaoDaConfirmacao(aberta ? atualizadoEm : null)}
            >
              <AlertDialogTrigger render={<Button variant="destructive" disabled={bloqueada || executando} type="button" />}>
                {executando ? "Processando…" : "Inativar unidade"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Inativar esta unidade?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ela deixará de aparecer nos escopos e agendamentos. Os dados existentes serão preservados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={!confirmacaoAberta}>
                    Inativar unidade
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={bloqueada || executando} type="submit">
              {executando ? "Processando…" : "Ativar unidade"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
