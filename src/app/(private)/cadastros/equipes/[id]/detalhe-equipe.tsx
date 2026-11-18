import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarEquipe, listarSupervisoresParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_EQUIPES, podeConsultarEstagiariosDaEquipe, podeGerenciarEquipes } from "@/lib/equipe/escopo-equipe";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { atualizarEquipe, alterarAtivacao } from "../actions";
import { EdicaoEquipe } from "./edicao-equipe";
import { NotificacaoEquipeCriada } from "./notificacao-equipe-criada";
import { EstagiariosEquipe } from "../estagiarios-equipe";
import { primeiro } from "../../../parametros";

type Props = { id: string; secao: "dados" | "ativacao"; searchParams?: Promise<ParametrosBusca> };

export async function DetalheEquipe({ id, secao, searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const equipe = await consultarEquipe(id, autor);
  if (!equipe) {
    return <p className="text-muted-foreground">Equipe não encontrada.</p>;
  }
  const supervisores = await listarSupervisoresParaEquipe(autor);
  const somenteLeitura = !podeGerenciarEquipes(autor);
  const modalDetalhes = secao === "dados";
  const parametros = modalDetalhes && searchParams ? await searchParams : {};
  const abaInformada = primeiro(parametros.abaEquipe);
  const abaDetalhes = abaInformada === "estagiarios" || (!abaInformada && primeiro(parametros.estagiarios))
    ? "estagiarios" : "dados";
  const valores = {
    nome: equipe.nome, unidadeId: equipe.unidadeId, ativa: equipe.ativa, supervisorId: equipe.supervisorId,
    atualizadoEm: equipe.atualizadoEm.toISOString(),
  };
  return (
    <div className="space-y-6">
      <NotificacaoEquipeCriada />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{equipe.nome}</h1>
          <Badge variant={equipe.ativa ? "default" : "outline"}>
            {equipe.ativa ? "Ativa" : "Inativa"}
          </Badge>
        </div>
        {!modalDetalhes && <p className="text-sm text-muted-foreground">
          Ative ou inative a equipe.
        </p>}
      </div>
      <EdicaoEquipe
        secao={secao}
        acaoAtualizar={atualizarEquipe.bind(null, equipe.id)} valores={valores}
        acaoAlterarAtivacao={alterarAtivacao.bind(null, equipe.id)}
        unidadeFixa={`${equipe.unidade.nome}${equipe.unidade.ativa ? "" : " (inativa)"}`}
        supervisores={supervisores} somenteLeitura={somenteLeitura}
        supervisorAtualNome={equipe.supervisor ? `${equipe.supervisor.nome}${equipe.supervisor.ativo ? "" : " (inativo)"}` : undefined}
        abaDetalhes={modalDetalhes ? abaDetalhes : undefined}
        estagiarios={modalDetalhes && podeConsultarEstagiariosDaEquipe(autor) ? (
          <Suspense fallback={<IndicadorCarregando texto="Carregando estagiários…" />}>
            <EstagiariosEquipe id={equipe.id} parametros={parametros} />
          </Suspense>
        ) : undefined}
      />
    </div>
  );
}
