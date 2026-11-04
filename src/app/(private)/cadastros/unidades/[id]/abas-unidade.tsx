"use client";

import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function observarNavegacao(atualizar: () => void) {
  window.addEventListener("hashchange", atualizar);
  window.addEventListener("popstate", atualizar);
  return () => {
    window.removeEventListener("hashchange", atualizar);
    window.removeEventListener("popstate", atualizar);
  };
}

function abaDaUrl() {
  return window.location.hash === "#periodos" ? "periodos" : "dados";
}

function abaInicial() {
  return "dados";
}

function definirAbaNaUrl(aba: "dados" | "periodos") {
  const url = new URL(window.location.href);
  url.hash = aba === "periodos" ? "periodos" : "";
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function AbasUnidade({
  bloqueada,
  dados,
  periodos,
}: {
  bloqueada: boolean;
  dados: ReactNode;
  periodos: ReactNode;
}) {
  const aba = useSyncExternalStore(observarNavegacao, abaDaUrl, abaInicial);

  useLayoutEffect(() => {
    if (bloqueada && window.location.hash === "#periodos") {
      definirAbaNaUrl("dados");
    }
  }, [bloqueada]);

  function alterarAba(valor: unknown) {
    if (bloqueada) return;
    if (valor !== "dados" && valor !== "periodos") return;
    definirAbaNaUrl(valor);
  }

  return (
    <Tabs value={bloqueada ? "dados" : aba} onValueChange={alterarAba} className="gap-6">
      <TabsList aria-label="Cadastro da unidade">
        <TabsTrigger disabled={bloqueada} value="dados">Dados da unidade</TabsTrigger>
        <TabsTrigger disabled={bloqueada} value="periodos">Períodos letivos</TabsTrigger>
      </TabsList>
      <TabsContent value="dados" keepMounted className="space-y-6">
        {dados}
      </TabsContent>
      <TabsContent value="periodos" keepMounted>
        {periodos}
      </TabsContent>
    </Tabs>
  );
}
