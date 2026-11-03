"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { situacaoPeriodoSchema } from "@/lib/periodo-letivo/dados-periodo";
import type { z } from "zod";

type Situacao = z.infer<typeof situacaoPeriodoSchema>;

export function FiltrosPeriodos({ situacaoInicial }: { situacaoInicial: Situacao }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [situacao, definirSituacao] = useOptimistic(situacaoInicial);
  const [atualizando, iniciarAtualizacao] = useTransition();
  function aplicar(valor: Situacao) {
    const parametros = new URLSearchParams(searchParams.toString());
    parametros.delete("periodosPagina");
    parametros.delete("periodoSalvo");
    parametros.delete("excluido");
    parametros.delete("confirmacaoPeriodo");
    if (valor !== "TODOS") parametros.set("periodosSituacao", valor);
    else parametros.delete("periodosSituacao");
    iniciarAtualizacao(() => {
      definirSituacao(valor);
      const caminho = parametros.size ? `${pathname}?${parametros}` : pathname;
      router.replace(`${caminho}#periodos`, { scroll: false });
    });
  }
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        Situação
        <select className="rounded border px-3 py-2" name="situacao" value={situacao} onChange={(evento) => aplicar(evento.target.value as Situacao)}>
          <option value="TODOS">Todos</option>
          <option value="FUTURO">Futuros</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="ENCERRADO">Encerrados</option>
        </select>
      </label>
      <button className="rounded border px-3 py-2" type="button" disabled={situacao === "TODOS"} onClick={() => aplicar("TODOS")}>Limpar filtros</button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
