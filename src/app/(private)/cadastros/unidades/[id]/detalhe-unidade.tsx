import { Suspense } from "react";
import { notFound } from "next/navigation";

import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Badge } from "@/components/ui/badge";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeGerenciavel } from "@/lib/unidade/consultar-unidade";
import { PERFIS_UNIDADES, podeAlterarAtivacaoDeUnidade } from "@/lib/unidade/escopo-unidade";
import { alterarAtivacao, atualizarUnidade } from "../actions";
import { EdicaoUnidade } from "./edicao-unidade";
import { NotificacaoUnidadeCriada } from "./notificacao-unidade-criada";
import { SecaoPeriodos, type ParametrosPeriodos } from "./periodos/secao-periodos";

type Props = {
  id: string;
  caminhoLista: string;
  searchParams: Promise<ParametrosPeriodos>;
  paginaCheia?: boolean;
  secao?: "dados" | "ativacao" | "periodos";
};

const DESCRICOES = {
  dados: "Altere as regras de funcionamento e de agendamento da unidade.",
  ativacao: "Ative ou inative a unidade.",
  periodos: "Gerencie os períodos letivos desta unidade.",
};

export async function DetalheUnidade({ id, caminhoLista, searchParams, paginaCheia = false, secao }: Props) {
  const autor = await exigirUsuario([...PERFIS_UNIDADES]);
  const unidade = await consultarUnidadeGerenciavel(id, autor);
  if (!unidade) {
    if (paginaCheia) notFound();
    return <p className="text-muted-foreground">Unidade não encontrada.</p>;
  }

  const periodos = (
    <Suspense fallback={<IndicadorCarregando texto="Carregando períodos letivos…" />}>
      <SecaoPeriodos unidadeId={id} autor={autor} caminhoLista={caminhoLista} searchParams={searchParams} />
    </Suspense>
  );

  return (
    <div className="space-y-6">
      <NotificacaoUnidadeCriada />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{unidade.nome}</h1>
          <Badge variant={unidade.ativa ? "default" : "outline"}>
            {unidade.ativa ? "Ativa" : "Inativa"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{DESCRICOES[secao ?? "dados"]}</p>
      </div>

      {secao === "periodos" ? periodos : (
        <EdicaoUnidade
          acaoAlterarAtivacao={alterarAtivacao.bind(null, unidade.id)}
          acaoAtualizar={atualizarUnidade.bind(null, unidade.id)}
          ativa={unidade.ativa}
          podeAlterarAtivacao={podeAlterarAtivacaoDeUnidade(autor)}
          podeAlterarDadosAdministrativos={autor.perfil !== "SECRETARIA"}
          periodos={secao ? undefined : periodos}
          secao={secao}
          valores={{ ...unidade, atualizadoEm: unidade.atualizadoEm.toISOString() }}
        />
      )}
    </div>
  );
}
