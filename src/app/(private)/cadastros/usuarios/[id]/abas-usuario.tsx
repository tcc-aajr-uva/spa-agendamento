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

function abaDaUrl(temAtendimento: boolean) {
  if (window.location.hash === "#convite") return "convite";
  if (temAtendimento && window.location.hash === "#atendimento") return "atendimento";
  return "dados";
}

function abaInicial() {
  return "dados";
}

export function AbasUsuario({
  dados,
  atendimento,
  convite,
  bloqueada,
}: {
  dados: ReactNode;
  atendimento?: ReactNode;
  convite: ReactNode;
  bloqueada: boolean;
}) {
  const temAtendimento = atendimento !== undefined && atendimento !== null;
  const aba = useSyncExternalStore(observarNavegacao, () => abaDaUrl(temAtendimento), abaInicial);

  useLayoutEffect(() => {
    if (!bloqueada || !window.location.hash) return;
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, [bloqueada]);

  function alterarAba(valor: unknown) {
    if (bloqueada || (valor !== "dados" && valor !== "convite" && (valor !== "atendimento" || !temAtendimento))) return;
    const url = new URL(window.location.href);
    url.hash = valor === "dados" ? "" : valor;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <Tabs value={bloqueada ? "dados" : aba} onValueChange={alterarAba} className="gap-6">
      <TabsList aria-label="Cadastro do usuário">
        <TabsTrigger disabled={bloqueada} value="dados">Dados do usuário</TabsTrigger>
        {temAtendimento && <TabsTrigger disabled={bloqueada} value="atendimento">Atendimento</TabsTrigger>}
        <TabsTrigger disabled={bloqueada} value="convite">Convite</TabsTrigger>
      </TabsList>
      <TabsContent value="dados" keepMounted className="space-y-6">
        {dados}
      </TabsContent>
      {temAtendimento && (
        <TabsContent value="atendimento" keepMounted>
          {atendimento}
        </TabsContent>
      )}
      <TabsContent value="convite" keepMounted>
        {convite}
      </TabsContent>
    </Tabs>
  );
}
