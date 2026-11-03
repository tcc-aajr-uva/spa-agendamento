"use client";

import { useActionState, useLayoutEffect, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { EstadoAcao } from "./acao";
import { AvisoAoSair } from "./aviso-ao-sair";

type Props = {
  acao: (estado: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  rotulo: string;
  confirmacao?: string;
  variante?: ComponentProps<typeof Button>["variant"];
  tamanho?: ComponentProps<typeof Button>["size"];
  larguraTotal?: boolean;
  children?: ReactNode;
};

export function FormularioAcao(props: Props) {
  const [versao, setVersao] = useState(0);

  useLayoutEffect(() => () => setVersao((atual) => atual + 1), []);

  return <Formulario key={versao} {...props} />;
}

function Formulario({ acao, rotulo, confirmacao, variante = "default", tamanho = "default", larguraTotal, children }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [confirmando, setConfirmando] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const confirmado = useRef(false);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    if (!confirmacao || confirmado.current) {
      confirmado.current = false;
      return;
    }
    evento.preventDefault();
    setConfirmando(true);
  }

  function continuar() {
    confirmado.current = true;
    setConfirmando(false);
    formulario.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formulario} action={enviar} onSubmit={aoEnviar} className="flex flex-col gap-3">
        {children}
        <Button type="submit" variant={variante} size={tamanho} disabled={enviando} className={larguraTotal ? "w-full" : "self-start"}>
          {enviando ? "Enviando…" : rotulo}
        </Button>
        {estado.erro && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription className="text-destructive">{estado.erro}</AlertDescription>
          </Alert>
        )}
        {estado.mensagem && (
          <Alert variant="success" aria-live="polite">
            <AlertDescription className="wrap-anywhere">{estado.mensagem}</AlertDescription>
          </Alert>
        )}
        {estado.avisarAoSair && <AvisoAoSair />}
      </form>
      {confirmacao && (
        <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{rotulo}</AlertDialogTitle>
              <AlertDialogDescription>{confirmacao}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction variant={variante === "destructive" ? "destructive" : "default"} onClick={continuar}>
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
