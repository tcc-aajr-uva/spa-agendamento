"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { periodoId: string; periodos: { id: string; nome: string }[] };

export function SeletorPeriodoAtendimento({ periodoId, periodos }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const busca = useSearchParams();
  const [atualizando, iniciarAtualizacao] = useTransition();
  const [selecao, selecionar] = useOptimistic(periodoId);
  const opcoes = [{ value: "", label: "Usar período vigente" }, ...periodos.map(({ id, nome }) => ({ value: id, label: nome }))];

  return (
    <Field className="gap-3" aria-busy={atualizando}>
      <FieldLabel htmlFor="periodo-atendimento-estagiario">Período letivo</FieldLabel>
      <Select items={opcoes} value={selecao} disabled={atualizando || periodos.length === 0} onValueChange={(valor) => {
        if (valor === null || atualizando) return;
        const parametros = new URLSearchParams(busca.toString());
        if (valor) parametros.set("atendimentoPeriodoEstagiario", valor);
        else parametros.delete("atendimentoPeriodoEstagiario");
        iniciarAtualizacao(() => {
          selecionar(valor);
          router.replace(`${caminho}?${parametros}`, { scroll: false });
        });
      }}>
        <SelectTrigger id="periodo-atendimento-estagiario" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
          <SelectValue placeholder="Selecione um período" />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
      {atualizando && <p className="text-sm text-muted-foreground" role="status">Carregando configuração…</p>}
    </Field>
  );
}
