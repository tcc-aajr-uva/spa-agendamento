"use client";

import { useFiltrosCadastro } from "@/components/use-filtros-cadastro";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = "ATIVAS" | "INATIVAS" | "TODAS";

const OPCOES_STATUS: { value: Status; label: string }[] = [
  { value: "ATIVAS", label: "Ativas" },
  { value: "INATIVAS", label: "Inativas" },
  { value: "TODAS", label: "Todas" },
];
type Props = {
  buscaInicial: string;
  unidadeInicial: string;
  statusInicial: Status;
  permitirInativas: boolean;
  unidades: { id: string; nome: string; ativa: boolean }[];
};

export function FiltrosEquipes({ buscaInicial, unidadeInicial, statusInicial, permitirInativas, unidades }: Props) {
  const opcoesUnidades = [
    { value: "", label: "Todas do meu escopo" },
    ...unidades.map((unidade) => ({
      value: unidade.id,
      label: `${unidade.nome}${unidade.ativa ? "" : " (inativa)"}`,
    })),
  ];
  const { busca, setRascunhoBusca, atualizando, atualizar, limpar } = useFiltrosCadastro({
    buscaInicial,
    filtros: { status: permitirInativas && statusInicial !== "ATIVAS" ? statusInicial : "", unidadeId: unidadeInicial },
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor="busca-equipes">Buscar</FieldLabel>
        <Input
          className="h-auto px-3 py-2 text-sm leading-5 shadow-xs"
          id="busca-equipes"
          maxLength={120}
          name="busca"
          onChange={(evento) => setRascunhoBusca(evento.target.value)}
          placeholder="Nome da equipe"
          type="search"
          value={busca}
        />
      </Field>
      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor="unidade-equipes">Unidade</FieldLabel>
        <Select
          items={opcoesUnidades}
          name="unidadeId"
          onValueChange={(valor) => atualizar(busca, { unidadeId: valor ?? "" })}
          value={unidadeInicial}
        >
          <SelectTrigger id="unidade-equipes" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
            <SelectValue placeholder="Todas do meu escopo" />
          </SelectTrigger>
          <SelectContent>
            {opcoesUnidades.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {permitirInativas && (
        <Field className="w-full gap-3 sm:w-80">
          <FieldLabel className="leading-5" htmlFor="status-equipes">Situação</FieldLabel>
          <Select
            items={OPCOES_STATUS}
            name="status"
            onValueChange={(valor) => {
              if (valor !== null) atualizar(busca, { status: valor === "ATIVAS" ? "" : valor });
            }}
            value={statusInicial}
          >
            <SelectTrigger id="status-equipes" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPCOES_STATUS.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" type="button"
        disabled={!busca && !unidadeInicial && statusInicial === "ATIVAS"}
        onClick={limpar}>
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
