"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const opcoesEquipes = equipes.map((opcao) => ({ value: opcao.id, label: opcao.nome }));
  const opcoesPeriodos = [
    { value: "", label: "Selecionar automaticamente" },
    ...periodos.map((opcao) => ({ value: opcao.id, label: opcao.nome })),
  ];

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
        <Field>
          <FieldLabel htmlFor="atendimento-equipe">Equipe</FieldLabel>
          <Select items={opcoesEquipes} value={selecao.equipeId} disabled={carregando}
            onValueChange={(valor) => { if (valor !== null) alterar("equipeId", valor); }}>
            <SelectTrigger id="atendimento-equipe" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
              <SelectValue placeholder="Selecione uma equipe" />
            </SelectTrigger>
            <SelectContent>
              {opcoesEquipes.map((opcao) => <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="atendimento-periodo">Período letivo</FieldLabel>
          <Select items={opcoesPeriodos} value={selecao.periodoId} disabled={carregando || periodos.length === 0}
            onValueChange={(valor) => { if (valor !== null) alterar("periodoId", valor); }}>
            <SelectTrigger id="atendimento-periodo" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
              <SelectValue placeholder="Selecionar automaticamente" />
            </SelectTrigger>
            <SelectContent>
              {opcoesPeriodos.map((opcao) => <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      {carregando && <p className="text-sm text-muted-foreground" role="status">Carregando configuração…</p>}
      <fieldset disabled={carregando} className="min-w-0 space-y-4">{children}</fieldset>
    </div>
  );
}
