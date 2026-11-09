"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const DestinoAlertasAba = createContext<HTMLDivElement | null>(null);

const ControleAba = createContext<{
  valor: string;
  bloqueada: boolean;
  registrarConflito: (aba: string, conflito: boolean) => void;
} | null>(null);

export function useConflitoAba(conflito: boolean) {
  const controle = useContext(ControleAba);
  const valor = controle?.valor;
  const registrarConflito = controle?.registrarConflito;

  useLayoutEffect(() => {
    if (!valor || !registrarConflito) return;
    registrarConflito(valor, conflito);
    return () => registrarConflito(valor, false);
  }, [conflito, registrarConflito, valor]);
}

export function useBloqueioAba() {
  return useContext(ControleAba)?.bloqueada ?? false;
}

type Aba = {
  valor: string;
  rotulo: string;
  conteudo: ReactNode;
  className?: string;
  alertas?: boolean;
};

type Props = {
  abas: Aba[];
  abaPadrao: string;
  rotulo: string;
  bloqueada: boolean;
};

function observarNavegacao(atualizar: () => void) {
  window.addEventListener("hashchange", atualizar);
  window.addEventListener("popstate", atualizar);
  return () => {
    window.removeEventListener("hashchange", atualizar);
    window.removeEventListener("popstate", atualizar);
  };
}

function definirAbaNaUrl(aba: string, abaPadrao: string) {
  const url = new URL(window.location.href);
  url.hash = aba === abaPadrao ? "" : aba;
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function AbasCadastro({ abas, abaPadrao, rotulo, bloqueada }: Props) {
  const aba = useSyncExternalStore(
    observarNavegacao,
    () => abas.find((item) => window.location.hash === `#${item.valor}`)?.valor ?? abaPadrao,
    () => abaPadrao,
  );
  const [destinoAlertas, definirDestinoAlertas] = useState<HTMLDivElement | null>(null);
  const [abaEmConflito, definirAbaEmConflito] = useState<string | null>(null);
  const abasBloqueadas = bloqueada || abaEmConflito !== null;
  const abaAtiva = bloqueada ? abaPadrao : abaEmConflito ?? aba;
  const possuiAlertas = abas.some((item) => item.alertas);

  const registrarConflito = useCallback((valor: string, conflito: boolean) => {
    definirAbaEmConflito((anterior) => {
      if (conflito) return valor;
      return anterior === valor ? null : anterior;
    });
  }, []);

  useLayoutEffect(() => {
    if (bloqueada && window.location.hash) definirAbaNaUrl(abaPadrao, abaPadrao);
    else if (!bloqueada && abaEmConflito && aba !== abaEmConflito) definirAbaNaUrl(abaEmConflito, abaPadrao);
  }, [aba, abaEmConflito, abaPadrao, bloqueada]);

  function alterarAba(valor: unknown) {
    if (abasBloqueadas || typeof valor !== "string" || !abas.some((item) => item.valor === valor)) return;
    definirAbaNaUrl(valor, abaPadrao);
  }

  return (
    <Tabs value={abaAtiva} onValueChange={alterarAba} className="gap-6">
      {possuiAlertas && <div ref={definirDestinoAlertas} className="empty:hidden" />}
      <TabsList aria-label={rotulo}>
        {abas.map((item) => (
          <TabsTrigger key={item.valor} disabled={abasBloqueadas} value={item.valor}>{item.rotulo}</TabsTrigger>
        ))}
      </TabsList>
      {abas.map((item) => (
        <TabsContent key={item.valor} value={item.valor} keepMounted className={item.className}>
          <ControleAba.Provider value={{ valor: item.valor, bloqueada: abasBloqueadas, registrarConflito }}>
            <DestinoAlertasAba.Provider value={item.alertas && abaAtiva === item.valor ? destinoAlertas : null}>
              {item.conteudo}
            </DestinoAlertasAba.Provider>
          </ControleAba.Provider>
        </TabsContent>
      ))}
    </Tabs>
  );
}
