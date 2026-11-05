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
  ativo: boolean;
  atualizadoEm: string;
  bloqueado: boolean;
  bloqueadoPorRascunho: boolean;
};

export function ControleAtivacaoUsuario({ executar, executando, ativo, atualizadoEm, bloqueado, bloqueadoPorRascunho }: Props) {
  const [versaoDaConfirmacao, definirVersaoDaConfirmacao] = useState<string | null>(null);
  const formularioId = useId();
  const confirmacaoAberta = ativo && !bloqueado && !executando && versaoDaConfirmacao === atualizadoEm;

  return (
    <form id={formularioId} action={executar} onSubmit={(evento) => {
      if (bloqueado || executando || (ativo && !confirmacaoAberta)) evento.preventDefault();
      definirVersaoDaConfirmacao(null);
    }}>
      <input type="hidden" name="atualizadoEm" value={confirmacaoAberta ? versaoDaConfirmacao : atualizadoEm} />
      <input type="hidden" name="operacao" value={ativo ? "INATIVAR" : "ATIVAR"} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Situação do usuário</h2></CardTitle>
          <CardDescription>
            {ativo
              ? "A inativação encerra as sessões e revoga os convites pendentes."
              : "Antes de ativar, confirme se os vínculos do usuário estão corretos."}
            {bloqueadoPorRascunho && (
              <span className="mt-2 block">
                Salve ou desfaça as alterações no formulário para mudar a situação do usuário.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          {ativo ? (
            <AlertDialog open={confirmacaoAberta}
              onOpenChange={(aberta) => definirVersaoDaConfirmacao(aberta ? atualizadoEm : null)}>
              <AlertDialogTrigger render={<Button variant="destructive" disabled={bloqueado} type="button" />}>
                {executando ? "Processando…" : "Inativar usuário"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Inativar este usuário?</AlertDialogTitle>
                  <AlertDialogDescription>
                    As sessões serão encerradas e os convites pendentes serão revogados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={!confirmacaoAberta}>
                    Inativar usuário
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={bloqueado} type="submit">
              {executando ? "Processando…" : "Ativar usuário"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
