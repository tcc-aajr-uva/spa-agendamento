"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Status = "ATIVAS" | "INATIVAS" | "TODAS";
type Filtros = { busca: string; unidadeId: string; status: Status };
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
      <label className="flex flex-col gap-1">
        Buscar
        <input className="rounded border px-3 py-2" name="busca" type="search" maxLength={120}
          value={filtros.busca} onChange={(evento) => alterarBusca(evento.target.value)} placeholder="Nome da equipe" />
      </label>
      <label className="flex flex-col gap-1">
        Unidade
        <select className="rounded border px-3 py-2" name="unidadeId" value={filtros.unidadeId}
          onChange={(evento) => aplicar({ ...filtros, unidadeId: evento.target.value })}>
          <option value="">Todas do meu escopo</option>
          {unidades.map((unidade) => <option key={unidade.id} value={unidade.id}>{unidade.nome}{!unidade.ativa && " (inativa)"}</option>)}
        </select>
      </label>
      {permitirInativas && (
        <label className="flex flex-col gap-1">
          Situação
          <select className="rounded border px-3 py-2" name="status" value={filtros.status}
            onChange={(evento) => aplicar({ ...filtros, status: evento.target.value as Status })}>
            <option value="ATIVAS">Ativas</option>
            <option value="INATIVAS">Inativas</option>
            <option value="TODAS">Todas</option>
          </select>
        </label>
      )}
      <button className="rounded border px-3 py-2" type="button"
        disabled={!filtros.busca && !filtros.unidadeId && filtros.status === "ATIVAS"}
        onClick={() => aplicar({ busca: "", unidadeId: "", status: "ATIVAS" })}>
        Limpar filtros
      </button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
