"use client";

import { useId, useState } from "react";
import { LockKeyholeIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { chaveDoPeriodo, type DatasPeriodo } from "@/lib/periodo-letivo/dados-periodo";

export function ControleExclusaoPeriodo({ executar, valores, motivosBloqueio, excluindo, bloqueioExterno, bloqueadoPorRascunho }: {
  executar: (formData: FormData) => void;
  valores: DatasPeriodo;
  motivosBloqueio: string[];
  excluindo: boolean;
  bloqueioExterno: boolean;
  bloqueadoPorRascunho: boolean;
}) {
  const descricaoId = useId();
  const formularioId = useId();
  const [versaoConfirmada, definirVersaoConfirmada] = useState<DatasPeriodo | null>(null);
  const bloqueado = motivosBloqueio.length > 0;
  const podeExcluir = !bloqueado && !bloqueioExterno && !excluindo;
  const confirmacaoAberta = podeExcluir && versaoConfirmada !== null &&
    chaveDoPeriodo(versaoConfirmada) === chaveDoPeriodo(valores);
  if (versaoConfirmada && !confirmacaoAberta) definirVersaoConfirmada(null);
  return (
    <form id={formularioId} action={executar} onSubmit={(evento) => {
      if (!confirmacaoAberta) {
        evento.preventDefault();
        return;
      }
      definirVersaoConfirmada(null);
    }}>
      <input type="hidden" name="versao" value={JSON.stringify(versaoConfirmada ?? valores)} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Excluir período</h2></CardTitle>
          <CardDescription>
            Somente períodos futuros sem configurações de atendimento nem agendamentos podem ser excluídos.
            {bloqueadoPorRascunho && <span className="mt-2 block">Salve as alterações antes de excluir o período.</span>}
          </CardDescription>
        </CardHeader>
        {bloqueado && (
          <CardContent className="space-y-4">
            <Alert id={descricaoId}>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Exclusão bloqueada</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-5">
                  {motivosBloqueio.map((motivo) => <li key={motivo}>{motivo}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
        <CardFooter className="justify-end">
          <AlertDialog open={confirmacaoAberta} onOpenChange={(aberta) => definirVersaoConfirmada(aberta && podeExcluir ? valores : null)}>
            <AlertDialogTrigger render={<Button variant="destructive" type="button" disabled={!podeExcluir} aria-describedby={bloqueado ? descricaoId : undefined} />}>
              {excluindo ? "Excluindo…" : "Excluir período"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este período letivo?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={!confirmacaoAberta}>
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
