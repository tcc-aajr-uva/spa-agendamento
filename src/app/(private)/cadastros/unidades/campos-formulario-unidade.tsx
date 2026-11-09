"use client";

import { useId } from "react";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

import type { CamposFormularioUnidade, DadosFormularioUnidade } from "./formulario-unidade-schema";

type Props = {
  bloqueada: boolean;
  control: Control<CamposFormularioUnidade, unknown, DadosFormularioUnidade>;
  errors: FieldErrors<CamposFormularioUnidade>;
  podeAlterarDadosAdministrativos: boolean;
  register: UseFormRegister<CamposFormularioUnidade>;
};

export function CamposFormularioUnidade({
  bloqueada,
  control,
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
          <FieldLegend className="text-base font-semibold">Permissões de agendamento</FieldLegend>
          <FieldDescription>Selecione os perfis que podem realizar agendamentos nesta unidade.</FieldDescription>
          {!podeAlterarDadosAdministrativos && (
            <FieldDescription>Somente a coordenação ou o administrador pode alterar estas permissões.</FieldDescription>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <OpcaoBooleana bloqueada={bloqueada} control={control} nome="permitePaciente" rotulo="Paciente" habilitada={podeAlterarDadosAdministrativos} />
            <OpcaoBooleana bloqueada={bloqueada} control={control} nome="permiteEstagiario" rotulo="Estagiário" habilitada={podeAlterarDadosAdministrativos} />
            <OpcaoBooleana bloqueada={bloqueada} control={control} nome="permiteSecretaria" rotulo="Secretaria" habilitada={podeAlterarDadosAdministrativos} />
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend className="text-base font-semibold">Funcionamento</FieldLegend>
          <FieldDescription>Defina a abertura de agendamentos, os horários de funcionamento e a duração dos blocos.</FieldDescription>
          <OpcaoBooleana bloqueada={bloqueada} control={control} nome="agendamentoAberto" rotulo="Agendamento aberto" />
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

function OpcaoBooleana({
  bloqueada,
  control,
  nome,
  rotulo,
  habilitada = true,
}: {
  bloqueada: boolean;
  control: Control<CamposFormularioUnidade, unknown, DadosFormularioUnidade>;
  nome: "permitePaciente" | "permiteEstagiario" | "permiteSecretaria" | "agendamentoAberto";
  rotulo: string;
  habilitada?: boolean;
}) {
  const desabilitada = bloqueada || !habilitada;
  const id = useId();

  return (
    <Controller
      control={control}
      name={nome}
      render={({ field }) => (
        <Field orientation="horizontal" data-disabled={desabilitada}>
          {!habilitada && <input name={nome} type="hidden" value={String(field.value)} />}
          <Checkbox
            checked={field.value}
            disabled={desabilitada}
            id={id}
            inputRef={field.ref}
            name={desabilitada ? undefined : nome}
            onBlur={field.onBlur}
            onCheckedChange={field.onChange}
            value="on"
          />
          <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
        </Field>
      )}
    />
  );
}
