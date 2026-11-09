"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { situacaoPeriodoSchema } from "@/lib/periodo-letivo/dados-periodo";
import type { z } from "zod";

type Situacao = z.infer<typeof situacaoPeriodoSchema>;

const OPCOES_SITUACAO: { value: Situacao; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "FUTURO", label: "Futuros" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "ENCERRADO", label: "Encerrados" },
];

export function FiltrosPeriodos({ situacaoInicial }: { situacaoInicial: Situacao }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const situacaoId = useId();
  const [atualizando, iniciarAtualizacao] = useTransition();
  function aplicar(valor: Situacao) {
    if (valor === situacaoInicial) return;
    const parametros = new URLSearchParams(searchParams.toString());
    parametros.delete("periodosPagina");
    parametros.delete("periodoSalvo");
    parametros.delete("excluido");
    parametros.delete("confirmacaoPeriodo");
    if (valor !== "TODOS") parametros.set("periodosSituacao", valor);
    else parametros.delete("periodosSituacao");
    iniciarAtualizacao(() => {
      const caminho = parametros.size ? `${pathname}?${parametros}` : pathname;
      router.replace(`${caminho}#periodos`, { scroll: false });
    });
  }
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field className="w-full gap-3 sm:w-80">
        <FieldLabel className="leading-5" htmlFor={situacaoId}>Situação</FieldLabel>
        <Select name="situacao" items={OPCOES_SITUACAO} value={situacaoInicial} onValueChange={(valor) => {
          if (valor !== null) aplicar(valor);
        }}>
          <SelectTrigger id={situacaoId} className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCOES_SITUACAO.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" type="button" disabled={situacaoInicial === "TODOS"} onClick={() => aplicar("TODOS")}>Limpar filtros</Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
