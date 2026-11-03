"use client";

import { useSyncExternalStore, type ReactNode } from "react";

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

export function AbasUnidade({
  dados,
  periodos,
}: {
  dados: ReactNode;
  periodos: ReactNode;
}) {
  const aba = useSyncExternalStore(observarNavegacao, abaDaUrl, abaInicial);

  function alterarAba(valor: unknown) {
    if (valor !== "dados" && valor !== "periodos") return;
    const url = new URL(window.location.href);
    url.hash = valor === "periodos" ? "periodos" : "";
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <Tabs value={aba} onValueChange={alterarAba} className="gap-6">
      <TabsList aria-label="Cadastro da unidade">
        <TabsTrigger value="dados">Dados da unidade</TabsTrigger>
        <TabsTrigger value="periodos">Períodos letivos</TabsTrigger>
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
