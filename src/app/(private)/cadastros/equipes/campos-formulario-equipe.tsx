"use client";

import { useId } from "react";
import { Controller, useWatch } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ControleFormularioEquipe } from "./formulario-equipe";

export type OpcoesCamposEquipe = {
  unidades?: { id: string; nome: string }[];
  unidadeFixa?: string;
  supervisores: { id: string; nome: string; email: string; unidadeIds: string[] }[];
  supervisorAtualNome?: string;
  somenteLeitura?: boolean;
};

type Props = OpcoesCamposEquipe & { controle: ControleFormularioEquipe; bloqueado: boolean };

export function CamposFormularioEquipe({
  controle, bloqueado, unidades = [], unidadeFixa, supervisores, supervisorAtualNome, somenteLeitura,
}: Props) {
  const { control, register, errors, setValue, clearErrors, ocultarErroSalvar, versaoBase, nomeInicial } = controle;
  const [unidadeId, supervisorId] = useWatch({ control, name: ["unidadeId", "supervisorId"] });
  const id = useId();
  const editando = unidadeFixa !== undefined;
  const supervisoresDisponiveis = supervisores.filter((supervisor) => supervisor.unidadeIds.includes(unidadeId));
  const responsavelIndisponivel = supervisorId !== null && !supervisoresDisponiveis.some((supervisor) => supervisor.id === supervisorId);
  const opcoesUnidades = unidades.map((unidade) => ({ value: unidade.id, label: unidade.nome }));
  const opcoesSupervisores = [
    { value: "", label: "Sem supervisor responsável" },
    ...(responsavelIndisponivel && supervisorId
      ? [{
          value: supervisorId,
          label: `${supervisorAtualNome ?? "Responsável anterior"}${somenteLeitura ? "" : " (indisponível para nova atribuição)"}`,
        }]
      : []),
    ...supervisoresDisponiveis.map((supervisor) => ({
      value: supervisor.id,
      label: `${supervisor.nome} — ${supervisor.email}`,
    })),
  ];

  return (
    <FieldGroup className="gap-8">
      <FieldSet>
        <FieldLegend className="text-base font-semibold">Identificação</FieldLegend>
        <FieldDescription>Informe a unidade e o nome que identificam a equipe no sistema.</FieldDescription>
        <div className="grid gap-4">
          <Field data-invalid={!!errors.unidadeId}>
            <FieldLabel htmlFor={`${id}-unidade`}>Unidade</FieldLabel>
            {editando ? (
              <>
                <Input id={`${id}-unidade`} className="h-auto px-3 py-2 leading-5 shadow-xs" value={unidadeFixa} readOnly disabled />
                <input type="hidden" name="atualizadoEm" value={versaoBase} />
              </>
            ) : (
              <Controller control={control} name="unidadeId" render={({ field }) => (
                <Select disabled={bloqueado} items={opcoesUnidades} name={field.name} required value={field.value}
                  onValueChange={(valor) => {
                    const unidade = valor ?? "";
                    if (unidade === field.value) return;
                    field.onChange(unidade);
                    setValue("supervisorId", null, { shouldDirty: true });
                    clearErrors("supervisorId");
                    ocultarErroSalvar();
                  }}>
                  <SelectTrigger id={`${id}-unidade`} ref={field.ref} onBlur={field.onBlur}
                    aria-invalid={!!errors.unidadeId}
                    aria-describedby={errors.unidadeId ? `${id}-unidade-erro` : undefined}
                    className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesUnidades.map((opcao) => (
                      <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            )}
            <FieldError id={`${id}-unidade-erro`} errors={[errors.unidadeId]} />
          </Field>
          <Field data-invalid={!!errors.nome}>
            <FieldLabel htmlFor={`${id}-nome`}>Nome da equipe</FieldLabel>
            <Input
              className="h-auto px-3 py-2 leading-5 shadow-xs"
              disabled={bloqueado}
              defaultValue={nomeInicial}
              id={`${id}-nome`}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? `${id}-nome-erro` : undefined}
              maxLength={120}
              minLength={2}
              {...register("nome", { onChange: ocultarErroSalvar })}
              required
            />
            <FieldError id={`${id}-nome-erro`} errors={[errors.nome]} />
          </Field>
        </div>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend className="text-base font-semibold">Supervisão</FieldLegend>
        <FieldDescription>Selecione um supervisor existente ou deixe a equipe sem responsável.</FieldDescription>
        <Field data-invalid={!!errors.supervisorId}>
          <FieldLabel htmlFor={`${id}-supervisor`}>Supervisor responsável (opcional)</FieldLabel>
          <Controller control={control} name="supervisorId" render={({ field }) => (
            <Select disabled={bloqueado || !unidadeId} items={opcoesSupervisores} name={field.name}
              value={field.value ?? ""} onValueChange={(valor) => {
                field.onChange(valor || null);
                ocultarErroSalvar();
              }}>
              <SelectTrigger id={`${id}-supervisor`} ref={field.ref} onBlur={field.onBlur}
                aria-invalid={!!errors.supervisorId}
                aria-describedby={errors.supervisorId ? `${id}-supervisor-erro` : undefined}
                className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                <SelectValue placeholder="Sem supervisor responsável" />
              </SelectTrigger>
              <SelectContent>
                {opcoesSupervisores.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          <FieldError id={`${id}-supervisor-erro`} errors={[errors.supervisorId]} />
          {!somenteLeitura && <FieldDescription>Novos supervisores podem ser cadastrados em Usuários.</FieldDescription>}
        </Field>
      </FieldSet>
    </FieldGroup>
  );
}
