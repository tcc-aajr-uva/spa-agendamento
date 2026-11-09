"use client";

import { CampoBuscaCadastro, FiltroSelecaoCadastro } from "@/components/campos-filtros-cadastro";
import { useFiltrosCadastro } from "@/components/use-filtros-cadastro";
import { Button } from "@/components/ui/button";

type Status = "ATIVAS" | "INATIVAS" | "TODAS";

const OPCOES_STATUS: { value: Status; label: string }[] = [
  { value: "ATIVAS", label: "Ativas" },
  { value: "INATIVAS", label: "Inativas" },
  { value: "TODAS", label: "Todas" },
];

type Props = {
  buscaInicial: string;
  statusInicial: Status;
  permitirInativas: boolean;
};

export function FiltrosUnidades({ buscaInicial, statusInicial, permitirInativas }: Props) {
  const { busca, setRascunhoBusca, atualizando, atualizar, limpar } = useFiltrosCadastro({
    buscaInicial,
    filtros: { status: statusInicial === "ATIVAS" ? "" : statusInicial },
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CampoBuscaCadastro
        id="busca-unidades"
        placeholder="Nome da unidade"
        valor={busca}
        aoAlterar={setRascunhoBusca}
      />
      {permitirInativas && (
        <FiltroSelecaoCadastro
          id="status-unidades"
          nome="status"
          rotulo="Situação"
          opcoes={OPCOES_STATUS}
          valor={statusInicial}
          aoAlterar={(valor) => {
            if (valor !== null) atualizar(busca, { status: valor === "ATIVAS" ? "" : valor });
          }}
        />
      )}
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" disabled={!busca && statusInicial === "ATIVAS"} onClick={limpar} type="button">
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
