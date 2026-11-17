import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarEquipe, listarSupervisoresParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_EQUIPES, podeGerenciarEquipes } from "@/lib/equipe/escopo-equipe";
import { atualizarEquipe, alterarAtivacao } from "../actions";
import { EdicaoEquipe } from "./edicao-equipe";
import { NotificacaoEquipeCriada } from "./notificacao-equipe-criada";

type Props = { id: string; paginaCheia?: boolean; secao?: "dados" | "ativacao" };

export async function DetalheEquipe({ id, paginaCheia = false, secao }: Props) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const equipe = await consultarEquipe(id, autor);
  if (!equipe) {
    if (paginaCheia) notFound();
    return <p className="text-muted-foreground">Equipe não encontrada.</p>;
  }
  const supervisores = await listarSupervisoresParaEquipe(autor);
  const somenteLeitura = !podeGerenciarEquipes(autor);
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
        <p className="text-sm text-muted-foreground">
          {secao === "ativacao" ? "Ative ou inative a equipe." : "Altere os dados de identificação e de supervisão da equipe."}
        </p>
      </div>
      <EdicaoEquipe
        secao={secao}
        acaoAtualizar={atualizarEquipe.bind(null, equipe.id)} valores={valores}
        acaoAlterarAtivacao={alterarAtivacao.bind(null, equipe.id)}
        unidadeFixa={`${equipe.unidade.nome}${equipe.unidade.ativa ? "" : " (inativa)"}`}
        supervisores={supervisores} somenteLeitura={somenteLeitura}
        supervisorAtualNome={equipe.supervisor ? `${equipe.supervisor.nome}${equipe.supervisor.ativo ? "" : " (inativo)"}` : undefined}
      />
    </div>
  );
}
