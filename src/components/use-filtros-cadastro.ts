"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  buscaInicial: string;
  filtros: Record<string, string>;
};

export function useFiltrosCadastro({ buscaInicial, filtros }: Props) {
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
    proximosFiltros.set("busca", proximaBusca.trim());

    parametros.delete("pagina");
    for (const [nome, valor] of proximosFiltros) {
      if (valor) parametros.set(nome, valor);
      else parametros.delete(nome);
    }

    const consulta = parametros.toString();
    iniciarAtualizacao(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
  }, [filtrosAplicados, pathname, router, searchParams]);

  useEffect(() => {
    if (atualizando || rascunhoBusca === null || rascunhoBusca.trim() === buscaInicial) return;
    const temporizador = window.setTimeout(() => atualizar(rascunhoBusca), 450);
    return () => window.clearTimeout(temporizador);
  }, [atualizando, atualizar, buscaInicial, rascunhoBusca]);

  function limpar() {
    setRascunhoBusca(null);
    iniciarAtualizacao(() => router.replace(pathname, { scroll: false }));
  }

  return { busca, setRascunhoBusca, atualizando, atualizar, limpar };
}
