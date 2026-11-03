import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarEquipe, listarSupervisoresParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_EQUIPES, podeGerenciarEquipes } from "@/lib/equipe/escopo-equipe";
import { atualizarEquipe, alterarAtivacao } from "../actions";
import { FormularioEquipe } from "../formulario-equipe";
import { ControleAtivacaoEquipe } from "./controle-ativacao";

type Props = { params: Promise<{ id: string }> };

export default function EquipePage({ params }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/equipes" prefetch={false} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para equipes
      </Button>
      <Suspense fallback={<p>Carregando equipe…</p>}>
        <Conteudo params={params} />
      </Suspense>
    </section>
  );
}

async function Conteudo({ params }: Props) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const { id } = await params;
  const equipe = await consultarEquipe(id, autor);
  if (!equipe) notFound();
  const supervisores = await listarSupervisoresParaEquipe(autor);
  const somenteLeitura = !podeGerenciarEquipes(autor);
  const valores = { nome: equipe.nome, unidadeId: equipe.unidadeId, ativa: equipe.ativa, supervisorId: equipe.supervisorId };
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{equipe.nome}</h1>
          <Badge variant={equipe.ativa ? "default" : "outline"}>
            {equipe.ativa ? "Ativa" : "Inativa"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Altere os dados de identificação e de supervisão da equipe.</p>
      </div>
      <FormularioEquipe
        acao={atualizarEquipe.bind(null, equipe.id)} valores={valores}
        unidadeFixa={`${equipe.unidade.nome}${equipe.unidade.ativa ? "" : " (inativa)"}`}
        supervisores={supervisores} somenteLeitura={somenteLeitura}
        supervisorAtualNome={equipe.supervisor ? `${equipe.supervisor.nome}${equipe.supervisor.ativo ? "" : " (inativo)"}` : undefined}
      />
      {!somenteLeitura && (
        <ControleAtivacaoEquipe acao={alterarAtivacao.bind(null, equipe.id)} valores={valores} />
      )}
    </div>
  );
}
