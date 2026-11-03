"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { chaveDaEquipe, type VersaoEquipe } from "@/lib/equipe/dados-equipe";
import type { EstadoEquipe } from "../actions";

type Props = {
  acao: (estado: EstadoEquipe, formData: FormData) => Promise<EstadoEquipe>;
  valores: VersaoEquipe;
};

export function ControleAtivacaoEquipe({ acao, valores }: Props) {
  const [estado, executar, executando] = useActionState(acao, {});
  const [confirmacaoAberta, definirConfirmacaoAberta] = useState(false);
  const formularioId = useId();
  const ultimaNotificacao = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!estado.sucesso || estado.versaoSucesso === undefined || ultimaNotificacao.current === estado.versaoSucesso) return;
    ultimaNotificacao.current = estado.versaoSucesso;
    toast.add({ title: estado.sucesso, type: "success", timeout: 5_000 });
  }, [estado.sucesso, estado.versaoSucesso]);

  return (
    <form id={formularioId} action={executar} onSubmit={() => definirConfirmacaoAberta(false)}>
      <input type="hidden" name="versao" value={chaveDaEquipe(valores)} />
      <input type="hidden" name="operacao" value={valores.ativa ? "INATIVAR" : "ATIVAR"} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Situação da equipe</h2></CardTitle>
          <CardDescription>
            {valores.ativa
              ? "A inativação retira a equipe dos fluxos ativos e preserva os vínculos e agendamentos existentes, sem cancelá-los automaticamente."
              : "A ativação torna a equipe novamente disponível nos fluxos do sistema."}
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
          {valores.ativa ? (
            <AlertDialog open={confirmacaoAberta} onOpenChange={definirConfirmacaoAberta}>
              <AlertDialogTrigger render={<Button variant="destructive" disabled={executando} type="button" />}>
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
                  <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={executando}>
                    Inativar equipe
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={executando} type="submit">
              {executando ? "Processando…" : "Ativar equipe"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
