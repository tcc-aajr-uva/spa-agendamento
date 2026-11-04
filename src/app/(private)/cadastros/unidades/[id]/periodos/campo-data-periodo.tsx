"use client";

import { useId, useState, type Ref } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  nome: "inicio" | "fim";
  rotulo: string;
  valor: string;
  desabilitado: boolean;
  erro?: string;
  referencia?: Ref<HTMLButtonElement>;
  aoDesfocar: () => void;
  aoAlterar: (valor: string) => void;
};

const PRIMEIRA_DATA = parseISO("0001-01-01");
const ULTIMA_DATA = parseISO("9999-12-31");
const INTERVALO_ANOS = 10;

export function CampoDataPeriodo({ nome, rotulo, valor, desabilitado, erro, referencia, aoDesfocar, aoAlterar }: Props) {
  const [aberto, definirAberto] = useState(false);
  const [anoAtual] = useState(() => new Date().getFullYear());
  const data = valor ? parseISO(valor) : undefined;
  const anoSelecionado = data?.getFullYear() ?? anoAtual;
  const primeiroAno = Math.max(1, Math.min(anoAtual - INTERVALO_ANOS, anoSelecionado));
  const ultimoAno = Math.min(9999, Math.max(anoAtual + INTERVALO_ANOS, anoSelecionado));
  const inicioNavegacao = parseISO(`${String(primeiroAno).padStart(4, "0")}-01-01`);
  const fimNavegacao = parseISO(`${String(ultimoAno).padStart(4, "0")}-12-31`);
  const id = useId();

  return (
    <Field data-invalid={Boolean(erro)}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <input type="hidden" name={nome} value={valor} disabled={desabilitado} />
      <Popover open={aberto && !desabilitado} onOpenChange={definirAberto}>
        <PopoverTrigger
          id={id}
          ref={referencia}
          onBlur={aoDesfocar}
          disabled={desabilitado}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          data-empty={!valor}
          render={<Button type="button" variant="outline" className="h-auto w-full justify-start px-3 py-2 text-left leading-5 font-normal shadow-xs data-[empty=true]:text-muted-foreground" />}
        >
          <CalendarIcon data-icon="inline-start" aria-hidden="true" />
          {data ? format(data, "dd/MM/yyyy") : "Selecione uma data"}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0" aria-label={`Selecionar ${rotulo.toLowerCase()}`}>
          <Calendar
            mode="single"
            locale={ptBR}
            captionLayout="dropdown"
            selected={data}
            defaultMonth={data}
            startMonth={inicioNavegacao}
            endMonth={fimNavegacao}
            disabled={desabilitado ? true : [{ before: PRIMEIRA_DATA }, { after: ULTIMA_DATA }]}
            autoFocus
            onSelect={(selecionada) => {
              if (desabilitado) return;
              aoAlterar(selecionada ? format(selecionada, "yyyy-MM-dd") : "");
              definirAberto(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {erro && <FieldError id={`${id}-erro`}>{erro}</FieldError>}
    </Field>
  );
}
