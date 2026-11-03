"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const origem = `${router.bfcacheId}:${pathname}?${searchParams.toString()}`;
  const recebidos: Filtros = { busca: buscaInicial, unidadeId: unidadeInicial, status: statusInicial };
  const [estado, setEstado] = useState({ origem, filtros: recebidos, destinos: [] as string[], geracao: 0 });
  if (estado.origem !== origem) {
    const indiceDaBuscaConfirmada = estado.destinos.indexOf(origem);
    const respostaDaBusca = indiceDaBuscaConfirmada >= 0;
    setEstado({
      origem,
      filtros: respostaDaBusca ? estado.filtros : recebidos,
      destinos: respostaDaBusca ? estado.destinos.slice(indiceDaBuscaConfirmada + 1) : [],
      geracao: respostaDaBusca ? estado.geracao : estado.geracao + 1,
    });
  }
  const filtros = estado.filtros;
  const [atualizando, iniciarAtualizacao] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizador.current !== null) clearTimeout(temporizador.current);
  }, [estado.geracao]);

  function cancelarBuscaPendente() {
    if (temporizador.current !== null) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  }

  function navegar(proximos: Filtros) {
    const parametros = new URLSearchParams();
    if (proximos.busca.trim()) parametros.set("busca", proximos.busca.trim());
    if (proximos.unidadeId) parametros.set("unidadeId", proximos.unidadeId);
    if (permitirInativas && proximos.status !== "ATIVAS") parametros.set("status", proximos.status);
    const consulta = parametros.toString();
    const caminho = consulta ? `/cadastros/equipes?${consulta}` : "/cadastros/equipes";
    const destino = `${router.bfcacheId}:/cadastros/equipes?${consulta}`;
    setEstado((atual) => atual.origem === destino ? atual : ({
      ...atual,
      destinos: [...atual.destinos.filter((pendente) => pendente !== destino), destino],
    }));
    iniciarAtualizacao(() => router.replace(caminho, { scroll: false }));
  }

  function alterarBusca(busca: string) {
    const proximos = { ...filtros, busca };
    setEstado((atual) => ({ ...atual, filtros: proximos }));
    cancelarBuscaPendente();
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      navegar(proximos);
    }, 450);
  }

  function aplicar(proximos: Filtros) {
    cancelarBuscaPendente();
    setEstado((atual) => ({ ...atual, filtros: proximos }));
    navegar(proximos);
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
          onChange={(evento) => alterarBusca(evento.target.value)}
          placeholder="Nome da equipe"
          type="search"
          value={filtros.busca}
        />
      </Field>
      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor="unidade-equipes">Unidade</FieldLabel>
        <Select
          items={opcoesUnidades}
          name="unidadeId"
          onValueChange={(valor) => aplicar({ ...filtros, unidadeId: valor ?? "" })}
          value={filtros.unidadeId}
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
              if (valor !== null) aplicar({ ...filtros, status: valor });
            }}
            value={filtros.status}
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
        disabled={!filtros.busca && !filtros.unidadeId && filtros.status === "ATIVAS"}
        onClick={() => aplicar({ busca: "", unidadeId: "", status: "ATIVAS" })}>
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
