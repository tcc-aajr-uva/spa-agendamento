"use client";

import { CampoBuscaCadastro, FiltroSelecaoCadastro } from "@/components/campos-filtros-cadastro";
import { useFiltrosCadastro } from "@/components/use-filtros-cadastro";
import { Button } from "@/components/ui/button";

type Status = "ATIVOS" | "INATIVOS" | "TODOS";

const OPCOES_STATUS: { value: Status; label: string }[] = [
  { value: "ATIVOS", label: "Ativos" },
  { value: "INATIVOS", label: "Inativos" },
  { value: "TODOS", label: "Todos" },
];

type Props = {
  buscaInicial: string;
  statusInicial: Status;
};

export function FiltrosUsuarios({ buscaInicial, statusInicial }: Props) {
  const { busca, setRascunhoBusca, atualizando, atualizar, limpar } = useFiltrosCadastro({
    buscaInicial,
    filtros: { status: statusInicial === "ATIVOS" ? "" : statusInicial },
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CampoBuscaCadastro
        id="busca-usuarios"
        placeholder="Nome ou e-mail"
        valor={busca}
        aoAlterar={setRascunhoBusca}
      />

      <FiltroSelecaoCadastro
        id="status-usuarios"
        nome="status"
        rotulo="Situação"
        opcoes={OPCOES_STATUS}
        valor={statusInicial}
        aoAlterar={(valor) => {
          if (valor !== null) atualizar(busca, { status: valor === "ATIVOS" ? "" : valor });
        }}
      />
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" disabled={!busca && statusInicial === "ATIVOS"} onClick={limpar} type="button">
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
