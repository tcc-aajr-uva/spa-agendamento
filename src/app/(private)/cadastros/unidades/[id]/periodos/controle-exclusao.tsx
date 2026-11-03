"use client";

import { useActionState, useId, useState } from "react";
import { CircleAlertIcon, LockKeyholeIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatasPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { EstadoPeriodo } from "./actions";

export function ControleExclusaoPeriodo({ acao, valores, motivosBloqueio }: {
  acao: (estado: EstadoPeriodo, formData: FormData) => Promise<EstadoPeriodo>; valores: DatasPeriodo; motivosBloqueio: string[];
}) {
  const [estado, excluir, excluindo] = useActionState(acao, {});
  const descricaoId = useId();
  const formularioId = useId();
  const [confirmacaoAberta, definirConfirmacaoAberta] = useState(false);
  const bloqueado = motivosBloqueio.length > 0;
  return (
    <form id={formularioId} action={excluir} onSubmit={(evento) => {
      if (bloqueado) {
        evento.preventDefault();
        return;
      }
      definirConfirmacaoAberta(false);
    }}>
      <input type="hidden" name="versao" value={JSON.stringify(valores)} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Excluir período</h2></CardTitle>
          <CardDescription>Somente períodos futuros sem configurações de atendimento nem agendamentos podem ser excluídos.</CardDescription>
        </CardHeader>
        {(bloqueado || estado.erro) && (
          <CardContent className="space-y-4">
            {bloqueado && (
              <Alert id={descricaoId}>
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>Exclusão bloqueada</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-5">
                    {motivosBloqueio.map((motivo) => <li key={motivo}>{motivo}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {estado.erro && (
              <Alert variant="destructive">
                <CircleAlertIcon aria-hidden="true" />
                <AlertTitle>Não foi possível excluir o período</AlertTitle>
                <AlertDescription>{estado.erro}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
        <CardFooter className="justify-end">
          <AlertDialog open={confirmacaoAberta} onOpenChange={definirConfirmacaoAberta}>
            <AlertDialogTrigger render={<Button variant="destructive" type="button" disabled={excluindo || bloqueado} aria-describedby={bloqueado ? descricaoId : undefined} />}>
              {excluindo ? "Excluindo…" : "Excluir período"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este período letivo?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={excluindo || bloqueado}>
                  Excluir período
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </form>
  );
}
