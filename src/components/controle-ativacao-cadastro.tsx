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
  textos: {
    titulo: string;
    descricaoAtivo: string;
    descricaoInativo: string;
    avisoRascunho: string;
    tituloConfirmacao: string;
    descricaoConfirmacao: string;
    rotuloAtivar: string;
    rotuloInativar: string;
  };
};

export function ControleAtivacaoCadastro({ executar, executando, ativo, atualizadoEm, bloqueado, bloqueadoPorRascunho, textos }: Props) {
  const [versaoDaConfirmacao, definirVersaoDaConfirmacao] = useState<string | null>(null);
  const formularioId = useId();
  const indisponivel = bloqueado || executando;
  const confirmacaoAberta = ativo && !indisponivel && versaoDaConfirmacao === atualizadoEm;

  return (
    <form id={formularioId} action={executar} onSubmit={(evento) => {
      if (indisponivel || (ativo && !confirmacaoAberta)) evento.preventDefault();
      definirVersaoDaConfirmacao(null);
    }}>
      <input type="hidden" name="atualizadoEm" value={confirmacaoAberta ? versaoDaConfirmacao : atualizadoEm} />
      <input type="hidden" name="operacao" value={ativo ? "INATIVAR" : "ATIVAR"} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>{textos.titulo}</h2></CardTitle>
          <CardDescription>
            {ativo
              ? textos.descricaoAtivo
              : textos.descricaoInativo}
            {bloqueadoPorRascunho && (
              <span className="mt-2 block">
                {textos.avisoRascunho}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          {ativo ? (
            <AlertDialog open={confirmacaoAberta}
              onOpenChange={(aberta) => definirVersaoDaConfirmacao(aberta ? atualizadoEm : null)}>
              <AlertDialogTrigger render={<Button variant="destructive" disabled={indisponivel} type="button" />}>
                {executando ? "Processando…" : textos.rotuloInativar}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{textos.tituloConfirmacao}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {textos.descricaoConfirmacao}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" type="submit" form={formularioId} disabled={!confirmacaoAberta}>
                    {textos.rotuloInativar}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={indisponivel} type="submit">
              {executando ? "Processando…" : textos.rotuloAtivar}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
