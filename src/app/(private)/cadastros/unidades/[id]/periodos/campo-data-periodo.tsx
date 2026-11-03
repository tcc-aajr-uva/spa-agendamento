"use client";

import { useState } from "react";
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
  invalido: boolean;
  aoAlterar: (valor: string) => void;
};

const PRIMEIRA_DATA = parseISO("0001-01-01");
const ULTIMA_DATA = parseISO("9999-12-31");
const INTERVALO_ANOS = 10;

export function CampoDataPeriodo({ nome, rotulo, valor, desabilitado, invalido, aoAlterar }: Props) {
  const [aberto, definirAberto] = useState(false);
  const [anoAtual] = useState(() => new Date().getFullYear());
  const data = valor ? parseISO(valor) : undefined;
  const anoSelecionado = data?.getFullYear() ?? anoAtual;
  const primeiroAno = Math.max(1, Math.min(anoAtual - INTERVALO_ANOS, anoSelecionado));
  const ultimoAno = Math.min(9999, Math.max(anoAtual + INTERVALO_ANOS, anoSelecionado));
  const inicioNavegacao = parseISO(`${String(primeiroAno).padStart(4, "0")}-01-01`);
  const fimNavegacao = parseISO(`${String(ultimoAno).padStart(4, "0")}-12-31`);
  const id = `periodo-${nome}`;

  return (
    <Field data-invalid={invalido}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <input type="hidden" name={nome} value={valor} disabled={desabilitado} />
      <Popover open={aberto} onOpenChange={definirAberto}>
        <PopoverTrigger
          id={id}
          disabled={desabilitado}
          aria-invalid={invalido}
          aria-describedby={invalido ? `${id}-erro` : undefined}
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
              aoAlterar(selecionada ? format(selecionada, "yyyy-MM-dd") : "");
              definirAberto(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {invalido && <FieldError id={`${id}-erro`}>Selecione a {rotulo.toLowerCase()}.</FieldError>}
    </Field>
  );
}
