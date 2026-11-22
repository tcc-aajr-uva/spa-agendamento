"use client";

import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { novaSolicitacaoSchema, type NovaSolicitacao } from "@/lib/solicitacao-acesso/dados-solicitacao";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { ESTADO_INICIAL_SOLICITACAO, type EstadoSolicitacaoAcesso } from "./estado-solicitacao";

type Props = {
  acao: (estado: EstadoSolicitacaoAcesso, formData: FormData) => Promise<EstadoSolicitacaoAcesso>;
  unidades: { id: string; nome: string }[];
};

export function FormularioSolicitacao({ acao, unidades }: Props) {
  const id = useId();
  const [estado, enviar, enviando] = useActionState(acao, ESTADO_INICIAL_SOLICITACAO);
  const [erroOculto, ocultarErro] = useState<EstadoSolicitacaoAcesso | null>(null);
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NovaSolicitacao>({
    defaultValues: { nome: "", email: "", unidadeId: "" },
    resolver: zodResolver(novaSolicitacaoSchema),
  });
  const opcoesUnidades = unidades.map((unidade) => ({ value: unidade.id, label: unidade.nome }));
  const bloqueado = enviando || isSubmitting;
  const aoAlterar = () => { if (estado.status === "erro") ocultarErro(estado); };
  const aoEnviar = handleSubmit((dados) => startTransition(() => enviar(formDataDaSolicitacao(dados))));

  if (estado.status === "sucesso") {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <CircleCheckIcon aria-hidden="true" />
          <AlertTitle>Solicitação enviada</AlertTitle>
          <AlertDescription>
            A coordenação da sua unidade vai analisar o pedido e entregar o link para você criar a senha.
          </AlertDescription>
        </Alert>
        <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/entrar" />}>
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={(evento) => {
      if (bloqueado) evento.preventDefault();
      else void aoEnviar(evento);
    }}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor={`${id}-perfil`}>Perfil</FieldLabel>
          <Input id={`${id}-perfil`} value={rotuloDoPerfil("ESTAGIARIO")} readOnly aria-readonly="true" className="bg-muted" />
        </Field>

        {([
          { campo: "nome", rotulo: "Nome", tipo: "text", autoComplete: "name" },
          { campo: "email", rotulo: "E-mail", tipo: "email", autoComplete: "email" },
        ] as const).map(({ campo, rotulo, tipo, autoComplete }) => (
          <Field key={campo} data-invalid={!!errors[campo]}>
            <FieldLabel htmlFor={`${id}-${campo}`}>{rotulo}</FieldLabel>
            <Input id={`${id}-${campo}`} type={tipo} autoComplete={autoComplete} disabled={bloqueado}
              maxLength={campo === "nome" ? 120 : undefined}
              aria-invalid={!!errors[campo]} aria-describedby={errors[campo] ? `${id}-${campo}-erro` : undefined}
              {...register(campo, { onChange: aoAlterar })} required />
            <FieldError id={`${id}-${campo}-erro`} errors={[errors[campo]]} />
          </Field>
        ))}

        <Field data-invalid={!!errors.unidadeId}>
          <FieldLabel htmlFor={`${id}-unidade`}>Unidade</FieldLabel>
          <Controller control={control} name="unidadeId" render={({ field }) => (
            <Select items={opcoesUnidades} name={field.name} value={field.value || null} disabled={bloqueado}
              onValueChange={(valor) => {
                field.onChange(valor ?? "");
                aoAlterar();
              }}>
              <SelectTrigger id={`${id}-unidade`} ref={field.ref} onBlur={field.onBlur} className="w-full"
                aria-invalid={!!errors.unidadeId} aria-describedby={errors.unidadeId ? `${id}-unidade-erro` : undefined}>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {opcoesUnidades.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          <FieldError id={`${id}-unidade-erro`} errors={[errors.unidadeId]} />
        </Field>

        <FieldDescription>
          Usamos o nome, o e-mail e a unidade só para analisar o pedido e criar o seu acesso.
        </FieldDescription>
      </FieldGroup>

      {estado.status === "erro" && erroOculto !== estado && (
        <AlertaErroOperacao titulo="Não foi possível enviar a solicitação" mensagem={estado.mensagem} />
      )}

      <Button size="lg" className="w-full" disabled={bloqueado} type="submit">
        {enviando && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
        {enviando ? "Enviando…" : "Solicitar acesso"}
      </Button>
    </form>
  );
}

function formDataDaSolicitacao(dados: NovaSolicitacao): FormData {
  const formData = new FormData();
  formData.set("nome", dados.nome);
  formData.set("email", dados.email);
  formData.set("unidadeId", dados.unidadeId);
  return formData;
}
