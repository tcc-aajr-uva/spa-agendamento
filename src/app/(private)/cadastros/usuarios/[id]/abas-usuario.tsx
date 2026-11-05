"use client";

import { createContext, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const DestinoAlertasAtendimento = createContext<HTMLDivElement | null>(null);

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
  const [destinoAlertas, definirDestinoAlertas] = useState<HTMLDivElement | null>(null);
  const abaAtiva = bloqueada ? "dados" : aba;

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
    <Tabs value={abaAtiva} onValueChange={alterarAba} className="gap-6">
      {temAtendimento && <div ref={definirDestinoAlertas} className="empty:hidden" />}
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
          <DestinoAlertasAtendimento.Provider value={abaAtiva === "atendimento" ? destinoAlertas : null}>
            {atendimento}
          </DestinoAlertasAtendimento.Provider>
        </TabsContent>
      )}
      <TabsContent value="convite" keepMounted>
        {convite}
      </TabsContent>
    </Tabs>
  );
}
