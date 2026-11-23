"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  buscaInicial: string;
  filtros: Record<string, string>;
  parametroBusca?: string;
  parametroPagina?: string;
  salvarBusca?: (texto: string) => Promise<void>;
};

export function useFiltrosCadastro({ buscaInicial, filtros, parametroBusca = "busca", parametroPagina = "pagina", salvarBusca }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rascunhoBusca, setRascunhoBusca] = useState<string | null>(null);
  const [buscaAplicadaAnterior, setBuscaAplicadaAnterior] = useState(buscaInicial);
  const [atualizando, iniciarAtualizacao] = useTransition();
  const busca = rascunhoBusca ?? buscaInicial;
  const filtrosAplicados = new URLSearchParams(filtros).toString();

  if (buscaAplicadaAnterior !== buscaInicial) {
    setBuscaAplicadaAnterior(buscaInicial);
    if (rascunhoBusca?.trim() === buscaInicial) setRascunhoBusca(null);
  }

  useLayoutEffect(() => () => setRascunhoBusca(null), []);

  const atualizar = useCallback((proximaBusca: string, alteracoes: Record<string, string> = {}) => {
    const parametros = new URLSearchParams(searchParams.toString());
    const proximosFiltros = new URLSearchParams(filtrosAplicados);
    for (const [nome, valor] of Object.entries(alteracoes)) proximosFiltros.set(nome, valor);
    if (!salvarBusca) proximosFiltros.set(parametroBusca, proximaBusca.trim());

    parametros.delete(parametroPagina);
    for (const [nome, valor] of proximosFiltros) {
      if (valor) parametros.set(nome, valor);
      else parametros.delete(nome);
    }

    const consulta = parametros.toString();
    const destino = consulta ? `${pathname}?${consulta}` : pathname;
    iniciarAtualizacao(async () => {
      if (salvarBusca && proximaBusca.trim() !== buscaInicial) await salvarBusca(proximaBusca.trim());
      router.replace(destino, { scroll: false });
    });
  }, [buscaInicial, filtrosAplicados, parametroBusca, parametroPagina, pathname, router, salvarBusca, searchParams]);

  useEffect(() => {
    if (atualizando || rascunhoBusca === null || rascunhoBusca.trim() === buscaInicial) return;
    const temporizador = window.setTimeout(() => atualizar(rascunhoBusca), 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizando, atualizar, buscaInicial, rascunhoBusca]);

  function limpar() {
    setRascunhoBusca(null);
    iniciarAtualizacao(async () => {
      if (salvarBusca) await salvarBusca("");
      router.replace(pathname, { scroll: false });
    });
  }

  return { busca, setRascunhoBusca, atualizar, atualizando, limpar };
}
