"use client";

import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Aba = {
  valor: string;
  rotulo: string;
  conteudo: ReactNode;
  className?: string;
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
  const abaAtiva = bloqueada ? abaPadrao : aba;

  useLayoutEffect(() => {
    if (bloqueada && window.location.hash) definirAbaNaUrl(abaPadrao, abaPadrao);
  }, [abaPadrao, bloqueada]);

  function alterarAba(valor: unknown) {
    if (bloqueada || typeof valor !== "string" || !abas.some((item) => item.valor === valor)) return;
    definirAbaNaUrl(valor, abaPadrao);
  }

  return (
    <Tabs value={abaAtiva} onValueChange={alterarAba} className="gap-6">
      <TabsList aria-label={rotulo}>
        {abas.map((item) => (
          <TabsTrigger key={item.valor} disabled={bloqueada} value={item.valor}>{item.rotulo}</TabsTrigger>
        ))}
      </TabsList>
      {abas.map((item) => (
        <TabsContent key={item.valor} value={item.valor} keepMounted className={item.className}>
          {item.conteudo}
        </TabsContent>
      ))}
    </Tabs>
  );
}
