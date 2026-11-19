"use client";

import { startTransition, useActionState, useId } from "react";
import Link from "next/link";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Home, Loader2, XCircle } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { dadosPacienteSchema, idadeEm, MAIORIDADE } from "@/lib/paciente/dados-paciente";
import { formatarCpf, formatarTelefone } from "@/lib/paciente/mascaras";
import type { EstadoInscricao } from "./actions";

type Props = {
  acao: (estado: EstadoInscricao, formData: FormData) => Promise<EstadoInscricao>;
  rotuloBotao: string;
  camposOcultos: Record<string, string>;
};

type NomeCampo = keyof z.input<typeof dadosPacienteSchema>;
type Mascara = { formatar: (valor: string) => string; tamanho: number; exemplo: string };
type Campo = { nome: NomeCampo; rotulo: string; tipo: string; autoComplete: string; largo?: boolean; mascara?: Mascara };

const MASCARA_CPF: Mascara = { formatar: formatarCpf, tamanho: 14, exemplo: "000.000.000-00" };
const MASCARA_TELEFONE: Mascara = { formatar: formatarTelefone, tamanho: 15, exemplo: "(21) 99999-9999" };

const CAMPOS_PACIENTE: Campo[] = [
  { nome: "nome", rotulo: "Nome completo do paciente", tipo: "text", autoComplete: "name", largo: true },
  { nome: "cpf", rotulo: "CPF", tipo: "text", autoComplete: "off", mascara: MASCARA_CPF },
  { nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date", autoComplete: "bday" },
  { nome: "telefone", rotulo: "Telefone com DDD", tipo: "tel", autoComplete: "tel", mascara: MASCARA_TELEFONE },
  { nome: "email", rotulo: "E-mail", tipo: "email", autoComplete: "email" },
];

const CAMPOS_RESPONSAVEL: Campo[] = [
  { nome: "responsavelNome", rotulo: "Nome do responsável legal", tipo: "text", autoComplete: "off" },
  { nome: "responsavelCpf", rotulo: "CPF do responsável legal", tipo: "text", autoComplete: "off", mascara: MASCARA_CPF },
];

type CamposProps = {
  campos: Campo[];
  prefixo: string;
  register: UseFormRegister<z.input<typeof dadosPacienteSchema>>;
  errors: FieldErrors<z.input<typeof dadosPacienteSchema>>;
};

function Campos({ campos, prefixo, register, errors }: CamposProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map((campo) => {
        const id = `${prefixo}-${campo.nome}`;
        const erro = errors[campo.nome];
        const registro = register(campo.nome);
        const { mascara } = campo;
        return (
          <Field key={campo.nome} data-invalid={!!erro} className={campo.largo ? "sm:col-span-2" : undefined}>
            <FieldLabel htmlFor={id}>{campo.rotulo}</FieldLabel>
            <Input
              id={id}
              type={campo.tipo}
              autoComplete={campo.autoComplete}
              inputMode={campo.nome.toLowerCase().includes("cpf") ? "numeric" : undefined}
              className="h-10 px-3"
              aria-invalid={!!erro}
              aria-describedby={erro ? `${id}-erro` : undefined}
              maxLength={mascara?.tamanho}
              placeholder={mascara?.exemplo}
              {...registro}
              onChange={(evento) => {
                if (mascara) evento.target.value = mascara.formatar(evento.target.value);
                void registro.onChange(evento);
              }}
            />
            <FieldError id={`${id}-erro`} errors={[erro]} />
          </Field>
        );
      })}
    </div>
  );
}

function ehMenorDeIdade(data: string | undefined): boolean {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const nascimento = new Date(`${data}T00:00:00Z`);
  const hoje = new Date();
  return !Number.isNaN(nascimento.getTime()) && nascimento <= hoje && idadeEm(nascimento, hoje) < MAIORIDADE;
}

function Sucesso({ estado }: { estado: EstadoInscricao }) {
  return (
    <Card className="animate-in fade-in-0 zoom-in-95 duration-300 ease-out">
      <CardHeader className="items-center text-center">
        <span aria-hidden className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="size-8" />
        </span>
        <CardTitle className="text-xl">{estado.codigo ? "Agendamento realizado" : "Inscrição recebida"}</CardTitle>
        <CardDescription className="text-base" aria-live="polite">
          {estado.mensagem}
        </CardDescription>
      </CardHeader>
      {estado.codigo && (
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted p-4">
            <span className="text-sm text-muted-foreground">Seu código</span>
            <strong className="font-mono text-3xl tracking-widest">{estado.codigo}</strong>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Anote o código. Se precisar cancelar, use o botão “Cancelar agendamento” na página inicial e informe o CPF do paciente e
            este código.
          </p>
        </CardContent>
      )}
      <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-center">
        {estado.linkCancelamento && (
          <Button variant="outline" size="lg" nativeButton={false} render={<Link href={estado.linkCancelamento} />}>
            <XCircle />
            Cancelar agendamento
          </Button>
        )}
        <Button variant="ghost" size="lg" nativeButton={false} render={<Link href="/" />}>
          <Home />
          Voltar ao início
        </Button>
      </CardFooter>
    </Card>
  );
}

export function FormularioPaciente({ acao, rotuloBotao, camposOcultos }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const prefixo = useId();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(dadosPacienteSchema), shouldUnregister: true });
  const menorDeIdade = ehMenorDeIdade(useWatch({ control, name: "dataNascimento" }));

  const aoEnviar = handleSubmit((_dados, evento) => {
    const formData = new FormData(evento?.target as HTMLFormElement);
    startTransition(() => enviar(formData));
  });

  if (estado.mensagem) return <Sucesso estado={estado} />;

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-6">
      {Object.entries(camposOcultos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <FieldSet>
        <FieldLegend>Dados do paciente</FieldLegend>
        <FieldDescription>Todos os campos são obrigatórios.</FieldDescription>
        <Campos campos={CAMPOS_PACIENTE} prefixo={prefixo} register={register} errors={errors} />
      </FieldSet>
      {menorDeIdade && (
        <FieldSet className="rounded-xl border border-dashed bg-card p-4 animate-in fade-in-0 duration-200 ease-out">
          <FieldLegend>Responsável legal</FieldLegend>
          <FieldDescription>O paciente é menor de idade. Preencha com os dados do responsável legal, que fará a inscrição pelo paciente.</FieldDescription>
          <Campos campos={CAMPOS_RESPONSAVEL} prefixo={prefixo} register={register} errors={errors} />
        </FieldSet>
      )}
      {estado.erro && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={enviando} className="h-11 text-base sm:self-start sm:px-6">
        {enviando && <Loader2 className="animate-spin" />}
        {enviando ? "Enviando…" : rotuloBotao}
      </Button>
    </form>
  );
}
