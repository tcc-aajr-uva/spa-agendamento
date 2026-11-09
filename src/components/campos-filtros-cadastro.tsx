"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PropsBusca = {
  id: string;
  placeholder: string;
  valor: string;
  aoAlterar: (valor: string) => void;
};

export function CampoBuscaCadastro({ id, placeholder, valor, aoAlterar }: PropsBusca) {
  return (
    <Field className="w-full gap-3 sm:w-80">
      <FieldLabel className="leading-5" htmlFor={id}>Buscar</FieldLabel>
      <Input
        className="h-auto px-3 py-2 text-sm leading-5 shadow-xs"
        id={id}
        maxLength={120}
        name="busca"
        onChange={(evento) => aoAlterar(evento.target.value)}
        placeholder={placeholder}
        type="search"
        value={valor}
      />
    </Field>
  );
}

type PropsSelecao<Valor extends string> = {
  id: string;
  nome: string;
  rotulo: string;
  opcoes: { value: Valor; label: string }[];
  valor: Valor;
  placeholder?: string;
  aoAlterar: (valor: Valor | null) => void;
};

export function FiltroSelecaoCadastro<Valor extends string>({
  id, nome, rotulo, opcoes, valor, placeholder, aoAlterar,
}: PropsSelecao<Valor>) {
  return (
    <Field className="w-full gap-3 sm:w-80">
      <FieldLabel className="leading-5" htmlFor={id}>{rotulo}</FieldLabel>
      <Select<Valor> name={nome} items={opcoes} value={valor} onValueChange={aoAlterar}>
        <SelectTrigger id={id} className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
