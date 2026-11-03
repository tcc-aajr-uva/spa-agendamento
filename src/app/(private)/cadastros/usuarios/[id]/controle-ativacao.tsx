"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { EstadoEdicaoUsuario } from "./actions";

type Props = {
  acao: (estado: EstadoEdicaoUsuario, formData: FormData) => Promise<EstadoEdicaoUsuario>;
  ativo: boolean;
};

export function ControleAtivacaoUsuario({ acao, ativo }: Props) {
  const [estado, executar, executando] = useActionState(acao, {});
  const [confirmacaoAberta, definirConfirmacaoAberta] = useState(false);
  const formularioId = useId();

  useEffect(() => {
    if (!estado.sucesso) return;
    toast.add({ title: estado.sucesso, type: "success", timeout: 5_000 });
  }, [estado]);

  return (
    <form id={formularioId} action={executar} onSubmit={() => definirConfirmacaoAberta(false)}>
      <input name="operacao" type="hidden" value={ativo ? "INATIVAR" : "ATIVAR"} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Situação do usuário</h2></CardTitle>
          <CardDescription>
            {ativo
              ? "A inativação encerra as sessões e revoga os convites pendentes."
              : "Antes de ativar, confirme se os vínculos do usuário estão corretos."}
          </CardDescription>
        </CardHeader>
        {estado.erro && (
          <CardContent>
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Não foi possível alterar a situação</AlertTitle>
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        <CardFooter className="justify-end">
          {ativo ? (
            <AlertDialog open={confirmacaoAberta} onOpenChange={definirConfirmacaoAberta}>
              <AlertDialogTrigger render={<Button variant="destructive" disabled={executando} type="button" />}>
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
                  <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={executando}>
                    Inativar usuário
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={executando} type="submit">
              {executando ? "Processando…" : "Ativar usuário"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
