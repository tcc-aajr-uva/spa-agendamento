"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Status = "ATIVAS" | "INATIVAS" | "TODAS";

type Props = {
  buscaInicial: string;
  statusInicial: Status;
  permitirInativas: boolean;
};

export function FiltrosUnidades({ buscaInicial, statusInicial, permitirInativas }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(buscaInicial);
  const [status, setStatus] = useState(statusInicial);
  const [atualizando, iniciarAtualizacao] = useTransition();
  const buscaAnterior = useRef(buscaInicial);
  const statusAtual = useRef(statusInicial);

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
    if (buscaAnterior.current === busca) return;
    buscaAnterior.current = busca;
    const temporizador = window.setTimeout(() => atualizar(busca, statusAtual.current), 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizar, busca]);

  const alterarStatus = (novoStatus: Status) => {
    setStatus(novoStatus);
    statusAtual.current = novoStatus;
    atualizar(busca, novoStatus);
  };

  const limpar = () => {
    buscaAnterior.current = "";
    statusAtual.current = "ATIVAS";
    setBusca("");
    setStatus("ATIVAS");
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
          placeholder="Nome da unidade"
          type="search"
          value={busca}
        />
      </label>
      {permitirInativas && (
        <label className="flex flex-col gap-1">
          Status
          <select
            className="rounded border px-3 py-2"
            name="status"
            onChange={(evento) => alterarStatus(evento.target.value as Status)}
            value={status}
          >
            <option value="ATIVAS">Ativas</option>
            <option value="INATIVAS">Inativas</option>
            <option value="TODAS">Todas</option>
          </select>
        </label>
      )}
      <button className="rounded border px-3 py-2" disabled={!busca && status === "ATIVAS"} onClick={limpar} type="button">
        Limpar filtros
      </button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
