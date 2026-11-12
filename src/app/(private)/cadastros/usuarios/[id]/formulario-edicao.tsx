"use client";

import { useId, type FormEventHandler } from "react";
import { InfoIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CamposVinculosUsuario, type OpcoesVinculosUsuario } from "../campos-vinculos-usuario";
import type { CamposEdicaoUsuario } from "../formulario-usuario-schema";

export type OpcoesEdicaoUsuario = OpcoesVinculosUsuario & {
  possuiVinculosForaDoEscopo: boolean;
};

export function FormularioEdicaoUsuario({ formulario, acao, aoEnviar, aoAlterar, valores, unidadeIds, equipeIds, bloqueado, enviando,
  possuiVinculosForaDoEscopo, ...opcoes }: OpcoesEdicaoUsuario & {
  formulario: UseFormReturn<CamposEdicaoUsuario>;
  acao: (formData: FormData) => void;
  aoEnviar: FormEventHandler<HTMLFormElement>;
  aoAlterar: () => void;
  valores: CamposEdicaoUsuario;
  unidadeIds: string[];
  equipeIds: string[];
  bloqueado: boolean;
  enviando: boolean;
}) {
  const id = useId();
  const { register, setValue, formState: { errors, defaultValues } } = formulario;

  return (
    <form action={acao} noValidate onSubmit={aoEnviar}>
      <input type="hidden" name="atualizadoEm" value={defaultValues?.atualizadoEm ?? valores.atualizadoEm} />
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent>
          <FieldGroup className="gap-8">
            <FieldSet>
              <FieldLegend className="text-base font-semibold">Dados pessoais</FieldLegend>
              <FieldDescription>Atualize o nome usado para identificar o usuário.</FieldDescription>
              <Field data-invalid={!!errors.nome}>
                <FieldLabel htmlFor={id}>Nome</FieldLabel>
                <Input id={id} className="h-auto px-3 py-2 leading-5 shadow-xs" disabled={bloqueado}
                  defaultValue={valores.nome} maxLength={120} required aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? `${id}-erro` : undefined} {...register("nome", { onChange: aoAlterar })} />
                <FieldError id={`${id}-erro`} errors={[errors.nome]} />
              </Field>
            </FieldSet>
            <Separator />
            <FieldSet>
              <FieldLegend className="text-base font-semibold">Vínculos no seu escopo</FieldLegend>
              <FieldDescription>Gerencie as unidades e, quando aplicável, as equipes disponíveis para este usuário.</FieldDescription>
              {possuiVinculosForaDoEscopo && (
                <Alert>
                  <InfoIcon aria-hidden="true" />
                  <AlertTitle>Existem vínculos fora do seu escopo</AlertTitle>
                  <AlertDescription>Eles não são exibidos nesta tela e serão preservados.</AlertDescription>
                </Alert>
              )}
            </FieldSet>
            <CamposVinculosUsuario {...opcoes} unidadeIds={unidadeIds} equipeIds={equipeIds} bloqueado={bloqueado}
              erros={{ unidadeIds: errors.unidadeIds?.message, equipeIds: errors.equipeIds?.message }}
              aoAlterar={(campo, ids) => {
                setValue(campo, ids, { shouldDirty: true, shouldValidate: true }); aoAlterar();
              }} />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="lg" disabled={bloqueado} type="submit">
            {enviando ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
