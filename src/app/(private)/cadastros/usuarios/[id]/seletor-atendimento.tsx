"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  equipes: { id: string; nome: string }[];
  periodos: { id: string; nome: string }[];
  equipeId: string;
  periodoId: string;
  children: ReactNode;
};

export function SeletorAtendimento({ equipes, periodos, equipeId, periodoId, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();
  const [carregando, iniciar] = useTransition();
  const [selecao, selecionar] = useOptimistic({ equipeId, periodoId });

  function alterar(campo: "equipeId" | "periodoId", valor: string) {
    const parametros = new URLSearchParams(busca.toString());
    parametros.set("atendimentoEquipe", campo === "equipeId" ? valor : equipeId);
    if (campo === "equipeId") parametros.delete("atendimentoPeriodo");
    else parametros.set("atendimentoPeriodo", valor);
    iniciar(() => {
      selecionar({ equipeId: campo === "equipeId" ? valor : equipeId, periodoId: campo === "periodoId" ? valor : "" });
      router.replace(`${pathname}?${parametros}#atendimento`, { scroll: false });
    });
  }

  return (
    <div className="space-y-4" aria-busy={carregando}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span>Equipe</span>
          <select className="w-full rounded border px-3 py-2" value={selecao.equipeId} disabled={carregando}
            onChange={(evento) => alterar("equipeId", evento.target.value)}>
            <option value="" disabled>Selecione uma equipe</option>
            {equipes.map((opcao) => <option key={opcao.id} value={opcao.id}>{opcao.nome}</option>)}
          </select>
        </label>
        <label className="block space-y-1">
          <span>Período letivo</span>
          <select className="w-full rounded border px-3 py-2" value={selecao.periodoId} disabled={carregando || periodos.length === 0}
            onChange={(evento) => alterar("periodoId", evento.target.value)}>
            <option value="">Selecionar automaticamente</option>
            {periodos.map((opcao) => <option key={opcao.id} value={opcao.id}>{opcao.nome}</option>)}
          </select>
        </label>
      </div>
      {carregando && <p role="status">Carregando configuração…</p>}
      <fieldset disabled={carregando} className="min-w-0 space-y-4">{children}</fieldset>
    </div>
  );
}
