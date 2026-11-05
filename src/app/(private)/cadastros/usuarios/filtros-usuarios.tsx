"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = "ATIVOS" | "INATIVOS" | "TODOS";

const OPCOES_STATUS: { value: Status; label: string }[] = [
  { value: "ATIVOS", label: "Ativos" },
  { value: "INATIVOS", label: "Inativos" },
  { value: "TODOS", label: "Todos" },
];

type Props = {
  buscaInicial: string;
  statusInicial: Status;
};

export function FiltrosUsuarios({ buscaInicial, statusInicial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rascunhoBusca, setRascunhoBusca] = useState<string | null>(null);
  const [buscaAplicadaAnterior, setBuscaAplicadaAnterior] = useState(buscaInicial);
  const busca = rascunhoBusca ?? buscaInicial;
  const [atualizando, iniciarAtualizacao] = useTransition();

  if (buscaAplicadaAnterior !== buscaInicial) {
    setBuscaAplicadaAnterior(buscaInicial);
    if (rascunhoBusca?.trim() === buscaInicial) setRascunhoBusca(null);
  }

  useLayoutEffect(() => {
    return () => {
      setRascunhoBusca(null);
    };
  }, []);

  const atualizar = useCallback(
    (proximaBusca: string, proximoStatus: Status) => {
      const parametros = new URLSearchParams(searchParams.toString());
      parametros.delete("pagina");
      if (proximaBusca.trim()) parametros.set("busca", proximaBusca.trim());
      else parametros.delete("busca");
      if (proximoStatus === "ATIVOS") parametros.delete("status");
      else parametros.set("status", proximoStatus);
      const consulta = parametros.toString();
      iniciarAtualizacao(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (atualizando || rascunhoBusca === null || rascunhoBusca.trim() === buscaInicial) return;
    const temporizador = window.setTimeout(() => atualizar(rascunhoBusca, statusInicial), 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizando, atualizar, buscaInicial, rascunhoBusca, statusInicial]);

  const limpar = () => {
    setRascunhoBusca(null);
    iniciarAtualizacao(() => router.replace(pathname, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor="busca-usuarios">Buscar</FieldLabel>
        <Input
          className="h-auto px-3 py-2 text-sm leading-5 shadow-xs"
          id="busca-usuarios"
          maxLength={120}
          name="busca"
          onChange={(evento) => setRascunhoBusca(evento.target.value)}
          placeholder="Nome ou e-mail"
          type="search"
          value={busca}
        />
      </Field>

      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor="status-usuarios">Situação</FieldLabel>
        <Select
          name="status"
          items={OPCOES_STATUS}
          onValueChange={(valor) => {
            if (valor !== null) atualizar(busca, valor);
          }}
          value={statusInicial}
        >
          <SelectTrigger id="status-usuarios" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCOES_STATUS.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" disabled={!busca && statusInicial === "ATIVOS"} onClick={limpar} type="button">
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
