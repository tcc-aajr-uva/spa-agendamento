"use client";

import { startTransition, useActionState, useEffect, useId, useLayoutEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, LockKeyholeIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { chaveDoPeriodo, dadosPeriodoSchema, type DatasPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { EstadoPeriodo } from "./actions";
import { CampoDataPeriodo } from "./campo-data-periodo";
import { ControleExclusaoPeriodo } from "./controle-exclusao";

type AcaoPeriodo = (estado: EstadoPeriodo, formData: FormData) => Promise<EstadoPeriodo>;

type Props = {
  acao: AcaoPeriodo;
  unidade: string;
  valores?: DatasPeriodo;
  somenteLeitura?: boolean;
  emUso?: boolean;
  caminhoLista?: string;
  exclusao?: { acao: AcaoPeriodo; motivosBloqueio: string[] };
};

const PADRAO: DatasPeriodo = { inicio: "", fim: "" };
const CAMPOS = [
  { nome: "inicio", rotulo: "Data de início", dependente: "fim" },
  { nome: "fim", rotulo: "Data de fim", dependente: "inicio" },
] as const;

async function semAcaoDeExclusao(): Promise<EstadoPeriodo> {
  return {};
}

export function FormularioPeriodo(props: Props) {
  const [chave, definirChave] = useState(0);

  useLayoutEffect(() => {
    return () => definirChave((anterior) => anterior + 1);
  }, []);

  return <FormularioPeriodoInterno key={chave} {...props} />;
}

function FormularioPeriodoInterno({
  acao, unidade, valores = PADRAO, somenteLeitura = false, emUso = false, exclusao, caminhoLista,
}: Props) {
  const router = useRouter();
  const unidadeId = useId();
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [estadoExclusao, excluir, excluindo] = useActionState(exclusao?.acao ?? semAcaoDeExclusao, {});
  const [recarregando, iniciarRecarga] = useTransition();
  const [conflitosAceitos, definirConflitosAceitos] = useState<EstadoPeriodo[]>([]);
  const [conflitoExterno, definirConflitoExterno] = useState(false);
  const [erroOculto, definirErroOculto] = useState<EstadoPeriodo | null>(null);
  const { control, formState: { defaultValues, isDirty, isSubmitting }, handleSubmit, reset } = useForm<DatasPeriodo>({
    defaultValues: valores,
    resolver: zodResolver(dadosPeriodoSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const inicioBase = defaultValues?.inicio ?? valores.inicio;
  const fimBase = defaultValues?.fim ?? valores.fim;
  const inicioAtual = valores.inicio;
  const fimAtual = valores.fim;
  const versaoAtual = chaveDoPeriodo(valores);
  const versaoBase = chaveDoPeriodo({ inicio: inicioBase, fim: fimBase });
  const versaoMudou = versaoAtual !== versaoBase;

  if (isDirty && versaoMudou && !conflitoExterno) definirConflitoExterno(true);

  const conflitoServidor = [estado, estadoExclusao].some((resposta) =>
    resposta.versaoEmConflito &&
    (!conflitosAceitos.includes(resposta) || resposta.versaoEmConflito === versaoAtual),
  );
  const conflito = conflitoExterno || conflitoServidor || recarregando;
  const podeSalvar = !somenteLeitura && !emUso;
  const bloquearEnvio = !podeSalvar || enviando || excluindo || conflito;
  const erroSalvar = erroOculto === estado ? undefined : estado.erro;

  useEffect(() => {
    if (versaoMudou && !isDirty && !conflito) reset({ inicio: inicioAtual, fim: fimAtual });
  }, [conflito, fimAtual, inicioAtual, isDirty, reset, versaoMudou]);

  const enviarDatas = handleSubmit((datas) => {
    const formData = new FormData();
    formData.set("inicio", datas.inicio);
    formData.set("fim", datas.fim);
    if (valores !== PADRAO) formData.set("versao", JSON.stringify({ inicio: inicioBase, fim: fimBase }));
    startTransition(() => enviar(formData));
  });

  function carregarVersao() {
    reset(valores);
    definirConflitoExterno(false);
    definirErroOculto(estado);
    if (conflitoServidor) {
      definirConflitosAceitos([estado, estadoExclusao]);
      iniciarRecarga(() => router.refresh());
    }
  }

  if (estado.indisponivel || estadoExclusao.indisponivel) {
    return (
      <div className="space-y-4">
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Período letivo indisponível</AlertTitle>
          <AlertDescription>Este período foi excluído e não pode mais ser alterado.</AlertDescription>
        </Alert>
        {caminhoLista && (
          <Button variant="outline" nativeButton={false} render={<Link href={caminhoLista} prefetch={false} />}>
            Voltar para a lista
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {conflito && (
        <Alert className="has-data-[slot=alert-action]:pr-2.5 sm:has-data-[slot=alert-action]:pr-32" variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Período alterado em outra sessão</AlertTitle>
          <AlertDescription>
            O período foi atualizado depois que você abriu esta tela.
            <br />
            Carregue a versão mais recente para continuar.
          </AlertDescription>
          <AlertAction className="static col-span-2 mt-2 flex justify-end sm:absolute sm:top-1/2 sm:right-2 sm:mt-0 sm:-translate-y-1/2">
            <Button type="button" variant="outline" className="h-auto rounded-sm px-4 py-2"
              disabled={recarregando} onClick={carregarVersao}>
              {recarregando ? "Carregando…" : "Carregar"}
            </Button>
          </AlertAction>
        </Alert>
      )}
      {erroSalvar && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar o período</AlertTitle>
          <AlertDescription>{erroSalvar}</AlertDescription>
        </Alert>
      )}
      {estadoExclusao.erro && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível excluir o período</AlertTitle>
          <AlertDescription>{estadoExclusao.erro}</AlertDescription>
        </Alert>
      )}
      <form action={podeSalvar ? enviar : undefined} noValidate onSubmit={(evento) => {
        if (bloquearEnvio) {
          evento.preventDefault();
          return;
        }
        void enviarDatas(evento);
      }}>
        {valores !== PADRAO && <input name="versao" type="hidden" value={JSON.stringify({ inicio: inicioBase, fim: fimBase })} />}
        <Card className="sm:[--card-spacing:--spacing(6)]">
          <CardHeader>
            <CardTitle><h2>Datas do período</h2></CardTitle>
            <CardDescription>Defina o início e o fim do período letivo desta unidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={unidadeId}>Unidade</FieldLabel>
                <Input className="h-auto px-3 py-2 leading-5 shadow-xs" id={unidadeId} value={unidade} readOnly disabled />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                {CAMPOS.map(({ nome, rotulo, dependente }) => (
                  <Controller key={nome} control={control} name={nome} rules={{ deps: dependente }}
                    render={({ field, fieldState }) => (
                      <CampoDataPeriodo nome={nome} rotulo={rotulo} valor={field.value}
                        desabilitado={bloquearEnvio || isSubmitting} erro={fieldState.error?.message}
                        referencia={field.ref} aoDesfocar={field.onBlur}
                        aoAlterar={(valor) => {
                          field.onChange(valor);
                          definirErroOculto(estado);
                        }}
                      />
                    )} />
                ))}
              </div>
            </FieldGroup>
            {emUso && (
              <Alert>
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>Período em uso</AlertTitle>
                <AlertDescription>As datas estão bloqueadas porque este período possui configurações de atendimento ou agendamentos.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          {podeSalvar && (
            <CardFooter className="justify-end">
              <Button size="lg" type="submit" disabled={bloquearEnvio || isSubmitting}>
                {enviando ? "Salvando…" : valores === PADRAO ? "Criar período" : "Salvar alterações"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
      {exclusao && (
        <ControleExclusaoPeriodo executar={excluir} valores={valores} motivosBloqueio={exclusao.motivosBloqueio}
          excluindo={excluindo} bloqueioExterno={conflito || enviando || isSubmitting || isDirty}
          bloqueadoPorRascunho={isDirty && !conflito} />
      )}
    </div>
  );
}
