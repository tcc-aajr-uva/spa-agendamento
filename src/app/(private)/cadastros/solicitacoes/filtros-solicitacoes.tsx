"use client";

import { CampoBuscaCadastro, FiltroSelecaoCadastro } from "@/components/campos-filtros-cadastro";
import { useFiltrosCadastro } from "@/components/use-filtros-cadastro";
import { Button } from "@/components/ui/button";
import {
  OPCOES_SITUACAO_SOLICITACAO,
  SITUACAO_PADRAO_SOLICITACAO,
  type SituacaoSolicitacao,
} from "@/lib/solicitacao-acesso/situacao-listagem";

type Props = {
  buscaInicial: string;
  statusInicial: SituacaoSolicitacao;
};

export function FiltrosSolicitacoes({ buscaInicial, statusInicial }: Props) {
  const { busca, setRascunhoBusca, atualizando, atualizar, limpar } = useFiltrosCadastro({
    buscaInicial,
    filtros: { status: statusInicial === SITUACAO_PADRAO_SOLICITACAO ? "" : statusInicial },
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CampoBuscaCadastro
        id="busca-solicitacoes"
        placeholder="Nome ou e-mail"
        valor={busca}
        aoAlterar={setRascunhoBusca}
      />

      <FiltroSelecaoCadastro
        id="status-solicitacoes"
        nome="status"
        rotulo="Situação"
        opcoes={OPCOES_SITUACAO_SOLICITACAO}
        valor={statusInicial}
        aoAlterar={(valor) => {
          if (valor !== null) atualizar(busca, { status: valor === SITUACAO_PADRAO_SOLICITACAO ? "" : valor });
        }}
      />
      <Button className="h-auto px-4 py-2 leading-5 shadow-xs" variant="outline"
        disabled={!busca && statusInicial === SITUACAO_PADRAO_SOLICITACAO} onClick={limpar} type="button">
        Limpar filtros
      </Button>
      {atualizando && <span className="text-sm" aria-live="polite">Atualizando…</span>}
    </div>
  );
}
