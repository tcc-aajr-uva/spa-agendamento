"use client";

import { useActionState, useState } from "react";
import { CircleAlertIcon, LockKeyholeIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { chaveDoPeriodo, type DatasPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { EstadoPeriodo } from "./actions";
import { CampoDataPeriodo } from "./campo-data-periodo";

type Props = {
  acao: (estado: EstadoPeriodo, formData: FormData) => Promise<EstadoPeriodo>;
  unidade: string;
  valores?: DatasPeriodo;
  somenteLeitura?: boolean;
  emUso?: boolean;
};
const PADRAO: DatasPeriodo = { inicio: "", fim: "" };

export function FormularioPeriodo({ acao, ...props }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return <CamposPeriodo {...props} estado={estado} enviar={enviar} enviando={enviando} />;
}

function CamposPeriodo({
  unidade, valores = PADRAO, somenteLeitura = false, emUso = false, estado, enviar, enviando,
}: Omit<Props, "acao"> & { estado: EstadoPeriodo; enviar: (formData: FormData) => void; enviando: boolean }) {
  const [rascunho, setRascunho] = useState<{ base: DatasPeriodo; datas: DatasPeriodo } | null>(null);
  const [tentouEnviar, definirTentouEnviar] = useState(false);
  const base = rascunho?.base ?? valores;
  const datas = rascunho?.datas ?? valores;
  const bloqueado = somenteLeitura || emUso;
  const externo = rascunho !== null && chaveDoPeriodo(base) !== chaveDoPeriodo(valores);
  return (
    <form action={bloqueado ? undefined : enviar}
      onSubmit={(evento) => {
        if (bloqueado) {
          evento.preventDefault();
          return;
        }
        if (!datas.inicio || !datas.fim) {
          evento.preventDefault();
          definirTentouEnviar(true);
          const campo = !datas.inicio ? "inicio" : "fim";
          evento.currentTarget.querySelector<HTMLButtonElement>(`#periodo-${campo}`)?.focus();
        }
      }}>
      {valores !== PADRAO && <input name="versao" type="hidden" value={JSON.stringify(base)} />}
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle><h2>Datas do período</h2></CardTitle>
          <CardDescription>Defina o início e o fim do período letivo desta unidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="periodo-unidade">Unidade</FieldLabel>
              <Input className="h-auto px-3 py-2 leading-5 shadow-xs" id="periodo-unidade" value={unidade} readOnly disabled />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoDataPeriodo nome="inicio" rotulo="Data de início" valor={datas.inicio}
                desabilitado={bloqueado || enviando} invalido={tentouEnviar && !datas.inicio}
                aoAlterar={(inicio) => setRascunho({ base, datas: { ...datas, inicio } })} />
              <CampoDataPeriodo nome="fim" rotulo="Data de fim" valor={datas.fim}
                desabilitado={bloqueado || enviando} invalido={tentouEnviar && !datas.fim}
                aoAlterar={(fim) => setRascunho({ base, datas: { ...datas, fim } })} />
            </div>
          </FieldGroup>
          {emUso && (
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Período em uso</AlertTitle>
              <AlertDescription>As datas estão bloqueadas porque este período possui configurações de atendimento ou agendamentos.</AlertDescription>
            </Alert>
          )}
          {externo && (
            <Alert variant="warning">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>Período alterado em outra sessão</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Suas alterações locais foram preservadas.</p>
                <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal text-left" disabled={enviando} onClick={() => setRascunho(null)}>
                  Descartar alterações locais e carregar a versão mais recente
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {estado.erro && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Não foi possível salvar o período</AlertTitle>
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        {!bloqueado && (
          <CardFooter className="justify-end">
            <Button size="lg" type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : valores === PADRAO ? "Criar período" : "Salvar alterações"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}
