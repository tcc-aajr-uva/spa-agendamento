"use client";

import { useCallback } from "react";

import { CampoBuscaCadastro } from "@/components/campos-filtros-cadastro";
import { useFiltrosCadastro } from "@/components/use-filtros-cadastro";
import { Button } from "@/components/ui/button";
import { salvarBusca } from "../../busca-salva";

export function FiltrosEstagiariosEquipe({ equipeId, buscaInicial }: { equipeId: string; buscaInicial: string }) {
  const salvarBuscaDaEquipe = useCallback((texto: string) => salvarBusca("estagiarios-equipe", texto, equipeId), [equipeId]);
  const { busca, setRascunhoBusca, atualizando, atualizar } = useFiltrosCadastro({
    buscaInicial,
    filtros: {},
    parametroPagina: "paginaEstagiarios",
    salvarBusca: salvarBuscaDaEquipe,
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CampoBuscaCadastro id="busca-estagiarios-equipe" placeholder="Nome ou e-mail do estagiário" valor={busca} aoAlterar={setRascunhoBusca} />
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" type="button" variant="outline" disabled={atualizando || (!busca && !buscaInicial)} onClick={() => {
        setRascunhoBusca("");
        atualizar("");
      }}>Limpar busca</Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
