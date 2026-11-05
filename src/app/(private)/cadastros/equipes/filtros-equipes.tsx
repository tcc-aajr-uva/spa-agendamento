"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = "ATIVAS" | "INATIVAS" | "TODAS";
type Filtros = { busca: string; unidadeId: string; status: Status };

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const opcoesUnidades = [
    { value: "", label: "Todas do meu escopo" },
    ...unidades.map((unidade) => ({
      value: unidade.id,
      label: `${unidade.nome}${unidade.ativa ? "" : " (inativa)"}`,
    })),
  ];
  const [rascunhoBusca, setRascunhoBusca] = useState<string | null>(null);
  const [buscaAplicadaAnterior, setBuscaAplicadaAnterior] = useState(buscaInicial);
  const busca = rascunhoBusca ?? buscaInicial;
  const [atualizando, iniciarAtualizacao] = useTransition();

  if (buscaAplicadaAnterior !== buscaInicial) {
    setBuscaAplicadaAnterior(buscaInicial);
    if (rascunhoBusca?.trim() === buscaInicial) setRascunhoBusca(null);
  }

  useLayoutEffect(() => {
    return () => setRascunhoBusca(null);
  }, []);

  const atualizar = useCallback(({ busca, unidadeId, status }: Filtros) => {
    const parametros = new URLSearchParams(searchParams.toString());
    parametros.delete("pagina");
    if (busca.trim()) parametros.set("busca", busca.trim());
    else parametros.delete("busca");
    if (unidadeId) parametros.set("unidadeId", unidadeId);
    else parametros.delete("unidadeId");
    if (permitirInativas && status !== "ATIVAS") parametros.set("status", status);
    else parametros.delete("status");
    const consulta = parametros.toString();
    iniciarAtualizacao(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
  }, [pathname, permitirInativas, router, searchParams]);

  useEffect(() => {
    if (atualizando || rascunhoBusca === null || rascunhoBusca.trim() === buscaInicial) return;
    const temporizador = window.setTimeout(() => {
      atualizar({ busca: rascunhoBusca, unidadeId: unidadeInicial, status: statusInicial });
    }, 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizando, atualizar, buscaInicial, rascunhoBusca, statusInicial, unidadeInicial]);

  function limpar() {
    setRascunhoBusca(null);
    iniciarAtualizacao(() => router.replace(pathname, { scroll: false }));
  }

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
          onValueChange={(valor) => atualizar({ busca, unidadeId: valor ?? "", status: statusInicial })}
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
              if (valor !== null) atualizar({ busca, unidadeId: unidadeInicial, status: valor });
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
