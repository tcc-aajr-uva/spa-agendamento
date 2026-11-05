"use client";

import { startTransition, useActionState, useId, useLayoutEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { PerfilCriavel } from "@/lib/usuario/hierarquia";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { CampoVinculosUsuario, type OpcaoVinculoUsuario } from "./campo-vinculos-usuario";
import type { EstadoCriacaoUsuario } from "./estado-usuario";
import { formDataDoUsuario, formularioCriacaoUsuarioSchema, type CamposCriacaoUsuario } from "./formulario-usuario-schema";
import { ResultadoConvite } from "./resultado-convite";

type Props = {
  acao: (estado: EstadoCriacaoUsuario, formData: FormData) => Promise<EstadoCriacaoUsuario>;
  configuracoes: { perfil: PerfilCriavel; tipoVinculo: "unidadeIds" | "equipeIds"; opcoes: OpcaoVinculoUsuario[] }[];
};

export function FormularioUsuario(props: Props) {
  const [chave, definirChave] = useState(0);
  useLayoutEffect(() => () => definirChave((anterior) => anterior + 1), []);
  return <FormularioUsuarioInterno key={chave} {...props} cadastrarOutro={() => definirChave((anterior) => anterior + 1)} />;
}

function FormularioUsuarioInterno({ acao, configuracoes, cadastrarOutro }: Props & { cadastrarOutro: () => void }) {
  const router = useRouter();
  const id = useId();
  const [estado, enviar, enviando] = useActionState(acao, { status: "inicial" });
  const [erroOculto, ocultarErro] = useState<EstadoCriacaoUsuario | null>(null);
  const { control, register, handleSubmit, setValue, clearErrors, formState: { errors, isSubmitting } } =
    useForm<CamposCriacaoUsuario>({
      defaultValues: { nome: "", email: "", perfil: configuracoes[0]?.perfil, unidadeIds: [], equipeIds: [] },
      resolver: zodResolver(formularioCriacaoUsuarioSchema),
    });
  const perfil = useWatch({ control, name: "perfil" });
  const configuracao = configuracoes.find((item) => item.perfil === perfil);
  const tipo = configuracao?.tipoVinculo ?? "unidadeIds";
  const [unidadeIds, equipeIds] = useWatch({ control, name: ["unidadeIds", "equipeIds"] });
  const vinculos = tipo === "unidadeIds" ? unidadeIds : equipeIds;
  const opcoes = configuracao?.opcoes ?? [];
  const perfis = configuracoes.map(({ perfil }) => ({ value: perfil, label: rotuloDoPerfil(perfil) }));
  const bloqueado = enviando || isSubmitting;
  const aoAlterar = () => { if (estado.status === "erro") ocultarErro(estado); };
  const aoEnviar = handleSubmit((dados) => startTransition(() => enviar(formDataDoUsuario(dados))));

  if (estado.status === "sucesso") {
    return <ResultadoConvite linkConvite={estado.linkConvite} expiraEm={estado.expiraEm}
      cadastrarOutro={cadastrarOutro} voltarParaLista={() => router.push("/cadastros/usuarios")} />;
  }

  return (
    <div className="space-y-6">
      {estado.status === "erro" && erroOculto !== estado && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível criar o usuário</AlertTitle>
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      <form action={enviar} noValidate onSubmit={(evento) => {
        if (bloqueado || opcoes.length === 0) evento.preventDefault();
        else void aoEnviar(evento);
      }}>
        <Card className="sm:[--card-spacing:--spacing(6)]">
          <CardContent>
            <FieldGroup className="gap-8">
              <FieldSet>
                <FieldLegend className="text-base font-semibold">Identificação</FieldLegend>
                <FieldDescription>Defina o perfil e os dados de acesso do novo usuário.</FieldDescription>
                <Field data-invalid={!!errors.perfil}>
                  <FieldLabel htmlFor={`${id}-perfil`}>Perfil</FieldLabel>
                  <Controller control={control} name="perfil" render={({ field }) => (
                    <Select items={perfis} name={field.name} value={field.value} disabled={bloqueado}
                      onValueChange={(valor) => {
                        if (!valor || valor === field.value) return;
                        field.onChange(valor);
                        setValue("unidadeIds", [], { shouldDirty: true });
                        setValue("equipeIds", [], { shouldDirty: true });
                        clearErrors(["unidadeIds", "equipeIds"]);
                        aoAlterar();
                      }}>
                      <SelectTrigger id={`${id}-perfil`} ref={field.ref} onBlur={field.onBlur}
                        aria-invalid={!!errors.perfil} aria-describedby={errors.perfil ? `${id}-perfil-erro` : undefined}
                        className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{perfis.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  <FieldError id={`${id}-perfil-erro`} errors={[errors.perfil]} />
                </Field>
                {([{ campo: "nome", rotulo: "Nome" }, { campo: "email", rotulo: "E-mail" }] as const).map(({ campo, rotulo }) => (
                  <Field key={campo} data-invalid={!!errors[campo]}>
                    <FieldLabel htmlFor={`${id}-${campo}`}>{rotulo}</FieldLabel>
                    <Input id={`${id}-${campo}`} className="h-auto px-3 py-2 leading-5 shadow-xs" disabled={bloqueado}
                      type={campo === "email" ? "email" : "text"} maxLength={campo === "nome" ? 120 : undefined}
                      aria-invalid={!!errors[campo]} aria-describedby={errors[campo] ? `${id}-${campo}-erro` : undefined}
                      {...register(campo, { onChange: aoAlterar })} required />
                    <FieldError id={`${id}-${campo}-erro`} errors={[errors[campo]]} />
                  </Field>
                ))}
              </FieldSet>
              <Separator />
              <FieldSet>
                <FieldLegend className="text-base font-semibold">{tipo === "unidadeIds" ? "Unidades" : "Equipes"}</FieldLegend>
                <FieldDescription>Selecione os vínculos que ficarão disponíveis para este usuário.</FieldDescription>
                {opcoes.length === 0 ? (
                  <FieldDescription>Não há vínculos disponíveis para criar este perfil.</FieldDescription>
                ) : (
                  <CampoVinculosUsuario opcoes={opcoes} tipo={tipo} vinculos={vinculos} mesmaUnidade={perfil === "ESTAGIARIO"}
                    bloqueado={bloqueado} erro={errors[tipo]?.message}
                    aoAlterar={(ids) => { setValue(tipo, ids, { shouldDirty: true, shouldValidate: true }); aoAlterar(); }} />
                )}
                {opcoes.length > 0 && vinculos.length === 0 && !errors[tipo] && (
                  <FieldDescription>Selecione ao menos um vínculo para continuar.</FieldDescription>
                )}
                {vinculos.length > 0 && <FieldDescription>{vinculos.length} vínculo(s) selecionado(s).</FieldDescription>}
              </FieldSet>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="lg" disabled={bloqueado || opcoes.length === 0} type="submit">
              {enviando ? "Criando…" : "Criar usuário e gerar convite"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
