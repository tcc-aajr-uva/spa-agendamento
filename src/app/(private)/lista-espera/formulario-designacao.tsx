"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EquipeParaDesignar, EstagiarioParaDesignar } from "@/lib/lista-espera/designar-paciente";
import { DIAS_DA_SEMANA, rotuloDoTurno } from "@/lib/agendamento/regras";
import { dadosPacienteSchema, idadeEm, MAIORIDADE } from "@/lib/paciente/dados-paciente";
import { formatarCpf, formatarTelefone } from "@/lib/paciente/mascaras";
import type { EstadoAcao } from "../acao";

type Props = {
  acao: (estado: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  equipes: EquipeParaDesignar[];
};

type NomeCampo = keyof z.input<typeof dadosPacienteSchema>;
type Mascara = { formatar: (valor: string) => string; tamanho: number; exemplo: string };
type Campo = { nome: NomeCampo; rotulo: string; tipo: string; largo?: boolean; mascara?: Mascara };

const MASCARA_CPF: Mascara = { formatar: formatarCpf, tamanho: 14, exemplo: "000.000.000-00" };
const MASCARA_TELEFONE: Mascara = { formatar: formatarTelefone, tamanho: 15, exemplo: "(21) 99999-9999" };

const CAMPOS_PACIENTE: Campo[] = [
  { nome: "nome", rotulo: "Nome completo do paciente", tipo: "text", largo: true },
  { nome: "cpf", rotulo: "CPF", tipo: "text", mascara: MASCARA_CPF },
  { nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date" },
  { nome: "telefone", rotulo: "Telefone com DDD", tipo: "tel", mascara: MASCARA_TELEFONE },
  { nome: "email", rotulo: "E-mail", tipo: "email" },
];

const CAMPOS_RESPONSAVEL: Campo[] = [
  { nome: "responsavelNome", rotulo: "Nome do responsável legal", tipo: "text" },
  { nome: "responsavelCpf", rotulo: "CPF do responsável legal", tipo: "text", mascara: MASCARA_CPF },
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
              autoComplete="off"
              inputMode={campo.nome.toLowerCase().includes("cpf") ? "numeric" : undefined}
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

function descreverPreferencias(estagiario: EstagiarioParaDesignar): string {
  if (estagiario.preferencias.length === 0) return "sem preferência cadastrada";
  return estagiario.preferencias.map(({ diaSemana, turno }) => `${DIAS_DA_SEMANA[diaSemana].slice(0, 3)} ${rotuloDoTurno(turno).toLowerCase()}`).join(" · ");
}

function semVaga(estagiario: EstagiarioParaDesignar): boolean {
  return estagiario.ocupados >= estagiario.limite;
}

export function FormularioDesignacao(props: Props) {
  const [versao, setVersao] = useState(0);
  return <Formulario key={versao} {...props} aoRecomecar={() => setVersao((atual) => atual + 1)} />;
}

function Formulario({ acao, equipes, aoRecomecar }: Props & { aoRecomecar: () => void }) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const prefixo = useId();
  const [equipeId, setEquipeId] = useState(equipes[0]?.id ?? "");
  const [estagiarioId, setEstagiarioId] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(dadosPacienteSchema), shouldUnregister: true });
  const menorDeIdade = ehMenorDeIdade(useWatch({ control, name: "dataNascimento" }));

  const equipe = equipes.find((opcao) => opcao.id === equipeId);
  const estagiarios = equipe?.estagiarios ?? [];
  const estagiario = estagiarios.find((opcao) => opcao.id === estagiarioId);

  const aoEnviar = handleSubmit((_dados, evento) => {
    const formData = new FormData(evento?.target as HTMLFormElement);
    startTransition(() => enviar(formData));
  });

  if (estado.mensagem) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="success" aria-live="polite">
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="self-start" onClick={aoRecomecar}>
          Cadastrar outro paciente
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="equipeId" value={equipeId} />
      <input type="hidden" name="estagiarioId" value={estagiario?.id ?? ""} />
      <FieldSet>
        <FieldLegend>Designação</FieldLegend>
        <FieldDescription>Use a preferência de turno que o paciente marcou no formulário da faculdade para escolher o estagiário.</FieldDescription>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${prefixo}-equipe`}>Equipe</FieldLabel>
            <Select
              items={equipes.map((opcao) => ({ value: opcao.id, label: opcao.nome }))}
              value={equipeId}
              onValueChange={(valor) => {
                setEquipeId(String(valor ?? ""));
                setEstagiarioId("");
              }}
            >
              <SelectTrigger id={`${prefixo}-equipe`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((opcao) => (
                  <SelectItem key={opcao.id} value={opcao.id}>
                    {opcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${prefixo}-estagiario`}>Estagiário</FieldLabel>
            <Select
              items={estagiarios.map((opcao) => ({ value: opcao.id, label: opcao.nome }))}
              value={estagiario?.id ?? null}
              onValueChange={(valor) => setEstagiarioId(String(valor ?? ""))}
            >
              <SelectTrigger id={`${prefixo}-estagiario`} className="w-full">
                <SelectValue placeholder={estagiarios.length === 0 ? "Nenhum estagiário liberado" : "Escolha o estagiário"} />
              </SelectTrigger>
              <SelectContent>
                {estagiarios.map((opcao) => (
                  <SelectItem key={opcao.id} value={opcao.id} disabled={semVaga(opcao)}>
                    <span className="flex flex-col">
                      <span>
                        {opcao.nome} — {opcao.ocupados} de {opcao.limite} vagas
                      </span>
                      <span className="text-xs text-muted-foreground">{descreverPreferencias(opcao)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {estagiario && (
              <FieldDescription>
                Prefere {descreverPreferencias(estagiario)}. Ocupa {estagiario.ocupados} de {estagiario.limite} vagas.
              </FieldDescription>
            )}
          </Field>
        </div>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Dados do paciente</FieldLegend>
        <FieldDescription>Todos os campos são obrigatórios.</FieldDescription>
        <Campos campos={CAMPOS_PACIENTE} prefixo={prefixo} register={register} errors={errors} />
      </FieldSet>
      {menorDeIdade && (
        <FieldSet className="rounded-xl border border-dashed bg-card p-4 animate-in fade-in-0 duration-200 ease-out">
          <FieldLegend>Responsável legal</FieldLegend>
          <FieldDescription>O paciente é menor de idade. Preencha com os dados do responsável legal.</FieldDescription>
          <Campos campos={CAMPOS_RESPONSAVEL} prefixo={prefixo} register={register} errors={errors} />
        </FieldSet>
      )}
      {estado.erro && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={enviando || !estagiario} className="sm:self-start">
        {enviando && <Loader2 className="animate-spin" />}
        {enviando ? "Enviando…" : "Cadastrar e designar"}
      </Button>
    </form>
  );
}
