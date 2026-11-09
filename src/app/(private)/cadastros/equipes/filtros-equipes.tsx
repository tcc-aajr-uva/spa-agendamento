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
  unidadeInicial: string;
  statusInicial: Status;
  permitirInativas: boolean;
  unidades: { id: string; nome: string; ativa: boolean }[];
};

export function FiltrosEquipes({ buscaInicial, unidadeInicial, statusInicial, permitirInativas, unidades }: Props) {
  const opcoesUnidades = [
    { value: "", label: "Todas do meu escopo" },
    ...unidades.map((unidade) => ({
      value: unidade.id,
      label: `${unidade.nome}${unidade.ativa ? "" : " (inativa)"}`,
    })),
  ];
  const { busca, setRascunhoBusca, atualizando, atualizar, limpar } = useFiltrosCadastro({
    buscaInicial,
    filtros: { status: permitirInativas && statusInicial !== "ATIVAS" ? statusInicial : "", unidadeId: unidadeInicial },
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CampoBuscaCadastro
        id="busca-equipes"
        placeholder="Nome da equipe"
        valor={busca}
        aoAlterar={setRascunhoBusca}
      />
      <FiltroSelecaoCadastro
        id="unidade-equipes"
        nome="unidadeId"
        rotulo="Unidade"
        opcoes={opcoesUnidades}
        valor={unidadeInicial}
        placeholder="Todas do meu escopo"
        aoAlterar={(valor) => atualizar(busca, { unidadeId: valor ?? "" })}
      />
      {permitirInativas && (
        <FiltroSelecaoCadastro
          id="status-equipes"
          nome="status"
          rotulo="Situação"
          opcoes={OPCOES_STATUS}
          valor={statusInicial}
          aoAlterar={(valor) => {
            if (valor !== null) atualizar(busca, { status: valor === "ATIVAS" ? "" : valor });
          }}
        />
      )}
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline" type="button"
        disabled={!busca && !unidadeInicial && statusInicial === "ATIVAS"}
        onClick={limpar}>
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
