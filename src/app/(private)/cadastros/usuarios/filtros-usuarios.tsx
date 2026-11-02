"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  buscaInicial: string;
  statusInicial: "ATIVOS" | "INATIVOS" | "TODOS";
};

export function FiltrosUsuarios({ buscaInicial, statusInicial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(buscaInicial);
  const [status, setStatus] = useState(statusInicial);
  const [atualizando, iniciarAtualizacao] = useTransition();
  const buscaAnterior = useRef(buscaInicial);
  const statusAtual = useRef(statusInicial);

  const atualizar = useCallback(
    (proximaBusca: string, proximoStatus: string) => {
      const parametros = new URLSearchParams(searchParams.toString());
      parametros.delete("pagina");
      if (proximaBusca.trim()) {
        parametros.set("busca", proximaBusca.trim());
      } else {
        parametros.delete("busca");
      }
      if (proximoStatus === "ATIVOS") {
        parametros.delete("status");
      } else {
        parametros.set("status", proximoStatus);
      }
      const consulta = parametros.toString();
      iniciarAtualizacao(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (buscaAnterior.current === busca) return;
    buscaAnterior.current = busca;
    const temporizador = window.setTimeout(() => atualizar(busca, statusAtual.current), 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizar, busca]);

  const alterarStatus = (novoStatus: "ATIVOS" | "INATIVOS" | "TODOS") => {
    setStatus(novoStatus);
    statusAtual.current = novoStatus;
    atualizar(busca, novoStatus);
  };

  const limpar = () => {
    buscaAnterior.current = "";
    statusAtual.current = "ATIVOS";
    setBusca("");
    setStatus("ATIVOS");
    iniciarAtualizacao(() => router.replace(pathname, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        Buscar
        <input
          className="rounded border px-3 py-2"
          name="busca"
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Nome ou e-mail"
          type="search"
          value={busca}
        />
      </label>
      <label className="flex flex-col gap-1">
        Status
        <select
          className="rounded border px-3 py-2"
          name="status"
          onChange={(evento) => alterarStatus(evento.target.value as "ATIVOS" | "INATIVOS" | "TODOS")}
          value={status}
        >
          <option value="ATIVOS">Ativos</option>
          <option value="INATIVOS">Inativos</option>
          <option value="TODOS">Todos</option>
        </select>
      </label>
      <button className="rounded border px-3 py-2" disabled={!busca && status === "ATIVOS"} onClick={limpar} type="button">
        Limpar filtros
      </button>
      {atualizando && (
        <span className="text-sm" aria-live="polite">
          Atualizando…
        </span>
      )}
    </div>
  );
}
