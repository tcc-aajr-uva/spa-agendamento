"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  statusInicial: Status;
  permitirInativas: boolean;
};

export function FiltrosUnidades({ buscaInicial, statusInicial, permitirInativas }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rascunhoBusca, setRascunhoBusca] = useState<string | null>(null);
  const busca = rascunhoBusca ?? buscaInicial;
  const [atualizando, iniciarAtualizacao] = useTransition();
  const buscaAnterior = useRef<string | null>(null);

  useLayoutEffect(() => {
    return () => {
      buscaAnterior.current = null;
      setRascunhoBusca(null);
    };
  }, []);

  const atualizar = useCallback(
    (proximaBusca: string, proximoStatus: Status) => {
      const parametros = new URLSearchParams(searchParams.toString());
      parametros.delete("pagina");
      if (proximaBusca.trim()) parametros.set("busca", proximaBusca.trim());
      else parametros.delete("busca");
      if (proximoStatus === "ATIVAS") parametros.delete("status");
      else parametros.set("status", proximoStatus);
      const consulta = parametros.toString();
      iniciarAtualizacao(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (rascunhoBusca === null || buscaAnterior.current === rascunhoBusca) return;
    buscaAnterior.current = rascunhoBusca;
    const temporizador = window.setTimeout(() => atualizar(rascunhoBusca, statusInicial), 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizar, rascunhoBusca, statusInicial]);

  const limpar = () => {
    buscaAnterior.current = "";
    setRascunhoBusca("");
    iniciarAtualizacao(() => router.replace(pathname, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor="busca-unidades">Buscar</FieldLabel>
        <Input
          className="h-auto px-3 py-2 text-sm leading-5 shadow-xs"
          id="busca-unidades"
          name="busca"
          onChange={(evento) => setRascunhoBusca(evento.target.value)}
          placeholder="Nome da unidade"
          type="search"
          value={busca}
        />
      </Field>
      {permitirInativas && (
        <Field className="w-full gap-3 sm:w-80">
          <FieldLabel className="leading-5" htmlFor="status-unidades">Situação</FieldLabel>
          <Select
            name="status"
            items={OPCOES_STATUS}
            onValueChange={(valor) => {
              if (valor !== null) atualizar(busca, valor);
            }}
            value={statusInicial}
          >
            <SelectTrigger id="status-unidades" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
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
      )}
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" disabled={!busca && statusInicial === "ATIVAS"} onClick={limpar} type="button">
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
