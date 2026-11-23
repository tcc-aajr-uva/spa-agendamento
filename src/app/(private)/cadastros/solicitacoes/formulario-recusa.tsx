"use client";

import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  recusaSolicitacaoSchema,
  TAMANHO_MAXIMO_MOTIVO,
  type RecusaSolicitacao,
} from "@/lib/solicitacao-acesso/dados-solicitacao";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { ESTADO_INICIAL_RECUSA, type EstadoRecusaSolicitacao } from "./estado-solicitacao";
import { useFecharModal } from "./use-fechar-modal";

type Props = {
  acao: (estado: EstadoRecusaSolicitacao, formData: FormData) => Promise<EstadoRecusaSolicitacao>;
  solicitacao: { nome: string; email: string; unidade: string };
  pendente: boolean;
};

export function FormularioRecusa({ acao, solicitacao, pendente }: Props) {
  const id = useId();
  const fecharModal = useFecharModal("recusar");
  const [estado, enviar, enviando] = useActionState(acao, ESTADO_INICIAL_RECUSA);
  const [paraConfirmar, definirParaConfirmar] = useState<RecusaSolicitacao | null>(null);
  const [erroOculto, ocultarErro] = useState<EstadoRecusaSolicitacao | null>(null);
  const recusaNotificada = useRef(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecusaSolicitacao>({
    defaultValues: { motivo: "" },
    resolver: zodResolver(recusaSolicitacaoSchema),
  });
  const bloqueado = enviando || isSubmitting;
  const aoEnviar = handleSubmit((dados) => definirParaConfirmar(dados));

  useEffect(() => {
    if (estado.status !== "sucesso" || recusaNotificada.current) return;
    recusaNotificada.current = true;
    toast.add({ title: "Solicitação recusada", type: "success", timeout: 5_000 });
  }, [estado.status]);

  function confirmar() {
    if (!paraConfirmar) return;
    const formData = new FormData();
    formData.set("motivo", paraConfirmar.motivo);
    definirParaConfirmar(null);
    startTransition(() => enviar(formData));
  }

  if (estado.status === "sucesso") {
    return (
      <div className="space-y-4">
        <Alert>
          <CircleCheckIcon aria-hidden="true" />
          <AlertTitle>Solicitação recusada</AlertTitle>
          <AlertDescription>A decisão foi registrada e aparece no filtro de recusadas.</AlertDescription>
        </Alert>
        <div className="flex justify-end">
          <Button type="button" onClick={fecharModal}>Voltar à lista</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="font-medium">{solicitacao.nome}</p>
        <p className="text-sm text-muted-foreground">{solicitacao.email}</p>
        <p className="text-sm text-muted-foreground">Perfil: {rotuloDoPerfil("ESTAGIARIO")} — Unidade: {solicitacao.unidade}</p>
      </div>
      {!pendente ? (
        <p className="text-muted-foreground">Esta solicitação já foi analisada.</p>
      ) : (
        <>
          {estado.status === "erro" && erroOculto !== estado && (
            <AlertaErroOperacao titulo="Não foi possível recusar a solicitação" mensagem={estado.mensagem} />
          )}
          <form noValidate onSubmit={(evento) => {
            if (bloqueado) evento.preventDefault();
            else void aoEnviar(evento);
          }}>
            <Card className="sm:[--card-spacing:--spacing(6)]">
              <CardContent>
                <Field data-invalid={!!errors.motivo}>
                  <FieldLabel htmlFor={`${id}-motivo`}>Motivo (opcional)</FieldLabel>
                  <Textarea id={`${id}-motivo`} className="field-sizing-fixed" rows={4} maxLength={TAMANHO_MAXIMO_MOTIVO} disabled={bloqueado}
                    aria-invalid={!!errors.motivo} aria-describedby={errors.motivo ? `${id}-motivo-erro` : undefined}
                    {...register("motivo", { onChange: () => { if (estado.status === "erro") ocultarErro(estado); } })} />
                  <FieldDescription>O motivo fica registrado para consulta interna.</FieldDescription>
                  <FieldError id={`${id}-motivo-erro`} errors={[errors.motivo]} />
                </Field>
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="lg" variant="destructive" disabled={bloqueado} type="submit">
                  {enviando && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
                  {enviando ? "Recusando…" : "Recusar solicitação"}
                </Button>
              </CardFooter>
            </Card>
          </form>
          <AlertDialog open={paraConfirmar !== null} onOpenChange={(aberta) => { if (!aberta) definirParaConfirmar(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Recusar esta solicitação?</AlertDialogTitle>
                <AlertDialogDescription>
                  O estagiário não terá acesso ao sistema. Para liberar depois, será preciso uma nova solicitação.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" type="button" onClick={confirmar}>
                  Recusar solicitação
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
