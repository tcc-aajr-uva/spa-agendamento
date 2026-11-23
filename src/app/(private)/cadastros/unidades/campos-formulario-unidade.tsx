"use client";

import { useId } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

import type { CamposFormularioUnidade } from "./formulario-unidade-schema";

type Props = {
  errors: FieldErrors<CamposFormularioUnidade>;
  podeAlterarDadosAdministrativos: boolean;
  register: UseFormRegister<CamposFormularioUnidade>;
};

export function CamposFormularioUnidade({
  errors,
  podeAlterarDadosAdministrativos,
  register,
}: Props) {
  const id = useId();

  return (
    <>
      <input {...register("atualizadoEm")} type="hidden" />
      <FieldGroup className="gap-8">
        <FieldSet>
          <FieldLegend className="text-base font-semibold">Identificação</FieldLegend>
          <FieldDescription>Informe o nome que identifica a unidade no sistema.</FieldDescription>
          <Field data-invalid={Boolean(errors.nome)}>
            <FieldLabel htmlFor={`${id}-nome`}>Nome</FieldLabel>
            <Input
              {...register("nome")}
              aria-describedby={errors.nome ? `${id}-nome-erro` : undefined}
              aria-invalid={Boolean(errors.nome)}
              className="h-auto px-3 py-2 leading-5 shadow-xs read-only:bg-muted"
              id={`${id}-nome`}
              maxLength={120}
              readOnly={!podeAlterarDadosAdministrativos}
            />
            <FieldError id={`${id}-nome-erro`} errors={[errors.nome]} />
          </Field>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend className="text-base font-semibold">Funcionamento</FieldLegend>
          <FieldDescription>Defina os horários de funcionamento e a duração dos blocos.</FieldDescription>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={Boolean(errors.horaAbertura)}>
              <FieldLabel htmlFor={`${id}-abertura`}>Abertura</FieldLabel>
              <InputGroup className="h-auto shadow-xs">
                <InputGroupInput
                  {...register("horaAbertura", {
                    deps: ["horaFechamento", "duracaoBlocoMin"],
                  })}
                  aria-describedby={errors.horaAbertura ? `${id}-abertura-erro` : undefined}
                  aria-invalid={Boolean(errors.horaAbertura)}
                  className="h-auto py-2 leading-5"
                  id={`${id}-abertura`}
                  type="time"
                />
              </InputGroup>
              <FieldError id={`${id}-abertura-erro`} errors={[errors.horaAbertura]} />
            </Field>
            <Field data-invalid={Boolean(errors.horaFechamento)}>
              <FieldLabel htmlFor={`${id}-fechamento`}>Fechamento</FieldLabel>
              <InputGroup className="h-auto shadow-xs">
                <InputGroupInput
                  {...register("horaFechamento", {
                    deps: ["horaAbertura", "duracaoBlocoMin"],
                  })}
                  aria-describedby={errors.horaFechamento ? `${id}-fechamento-erro` : undefined}
                  aria-invalid={Boolean(errors.horaFechamento)}
                  className="h-auto py-2 leading-5"
                  id={`${id}-fechamento`}
                  type="time"
                />
              </InputGroup>
              <FieldError id={`${id}-fechamento-erro`} errors={[errors.horaFechamento]} />
            </Field>
            <Field data-invalid={Boolean(errors.duracaoBlocoMin)}>
              <FieldLabel htmlFor={`${id}-duracao`}>Duração do bloco</FieldLabel>
              <InputGroup className="h-auto shadow-xs">
                <InputGroupInput
                  {...register("duracaoBlocoMin", {
                    deps: ["horaAbertura", "horaFechamento"],
                  })}
                  aria-describedby={errors.duracaoBlocoMin ? `${id}-duracao-unidade ${id}-duracao-erro` : `${id}-duracao-unidade`}
                  aria-invalid={Boolean(errors.duracaoBlocoMin)}
                  className="h-auto py-2 leading-5"
                  id={`${id}-duracao`}
                  max={720}
                  min={1}
                  type="number"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText id={`${id}-duracao-unidade`}>min</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldError id={`${id}-duracao-erro`} errors={[errors.duracaoBlocoMin]} />
            </Field>
          </div>
        </FieldSet>
      </FieldGroup>
    </>
  );
}

