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
import { CampoVinculosUsuario, type OpcaoVinculoUsuario } from "../campo-vinculos-usuario";
import type { CamposEdicaoUsuario } from "../formulario-usuario-schema";

export type OpcoesEdicaoUsuario = {
  opcoes: OpcaoVinculoUsuario[];
  tipoVinculo: "unidadeIds" | "equipeIds";
  restringirEquipesAUmaUnidade: boolean;
  possuiVinculosForaDoEscopo: boolean;
};

export function FormularioEdicaoUsuario({ formulario, acao, aoEnviar, aoAlterar, valores, vinculos, bloqueado, enviando, opcoes,
  tipoVinculo, restringirEquipesAUmaUnidade, possuiVinculosForaDoEscopo }: OpcoesEdicaoUsuario & {
  formulario: UseFormReturn<CamposEdicaoUsuario>;
  acao: (formData: FormData) => void;
  aoEnviar: FormEventHandler<HTMLFormElement>;
  aoAlterar: () => void;
  valores: CamposEdicaoUsuario;
  vinculos: string[];
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
              <FieldDescription>Gerencie as {tipoVinculo === "unidadeIds" ? "unidades" : "equipes"} disponíveis para este usuário.</FieldDescription>
              {possuiVinculosForaDoEscopo && (
                <Alert>
                  <InfoIcon aria-hidden="true" />
                  <AlertTitle>Existem vínculos fora do seu escopo</AlertTitle>
                  <AlertDescription>Eles não são exibidos nesta tela e serão preservados.</AlertDescription>
                </Alert>
              )}
              <CampoVinculosUsuario opcoes={opcoes} vinculos={vinculos} tipo={tipoVinculo}
                mesmaUnidade={restringirEquipesAUmaUnidade} bloqueado={bloqueado} erro={errors[tipoVinculo]?.message}
                aoAlterar={(ids) => {
                  setValue(tipoVinculo, ids, { shouldDirty: true, shouldValidate: true });
                  aoAlterar();
                }} />
              {vinculos.length === 0 && <FieldDescription>O usuário ficará sem vínculos dentro do seu escopo.</FieldDescription>}
            </FieldSet>
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
