"use client";

import { useEffect, useOptimistic, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Aba = "dados" | "estagiarios";

type Props = {
  dados: ReactNode;
  estagiarios?: ReactNode;
  abaInicial: Aba;
  bloqueada: boolean;
};

export function AbasDetalhesEquipe({ dados, estagiarios, abaInicial, bloqueada }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const [navegando, iniciarNavegacao] = useTransition();
  const [aba, definirAba] = useOptimistic(abaInicial);
  const abaAtiva = bloqueada || !estagiarios ? "dados" : aba;

  useEffect(() => {
    if (!bloqueada || parametros.get("abaEquipe") === "dados") return;
    const busca = new URLSearchParams(parametros.toString());
    busca.set("abaEquipe", "dados");
    router.replace(`${caminho}?${busca}`, { scroll: false });
  }, [bloqueada, caminho, parametros, router]);

  function alterarAba(valor: unknown) {
    if (bloqueada || navegando || (valor !== "dados" && valor !== "estagiarios")) return;
    if (valor === "estagiarios" && !estagiarios) return;
    const busca = new URLSearchParams(parametros.toString());
    busca.set("abaEquipe", valor);
    iniciarNavegacao(() => {
      definirAba(valor);
      router.replace(`${caminho}?${busca}`, { scroll: false });
    });
  }

  return (
    <Tabs value={abaAtiva} onValueChange={alterarAba} className="gap-6">
      <TabsList aria-label="Detalhes da equipe">
        <TabsTrigger value="dados" disabled={bloqueada || navegando}>Dados da equipe</TabsTrigger>
        {estagiarios && <TabsTrigger value="estagiarios" disabled={bloqueada || navegando}>Estagiários</TabsTrigger>}
      </TabsList>
      <TabsContent value="dados" keepMounted className="space-y-6">{dados}</TabsContent>
      {estagiarios && <TabsContent value="estagiarios" keepMounted>{estagiarios}</TabsContent>}
    </Tabs>
  );
}
