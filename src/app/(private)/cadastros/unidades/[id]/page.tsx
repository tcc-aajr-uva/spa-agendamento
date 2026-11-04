import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeGerenciavel } from "@/lib/unidade/consultar-unidade";
import { PERFIS_UNIDADES, podeAlterarAtivacaoDeUnidade } from "@/lib/unidade/escopo-unidade";
import { alterarAtivacao, atualizarUnidade } from "../actions";
import { EdicaoUnidade } from "./edicao-unidade";
import { NotificacaoUnidadeCriada } from "./notificacao-unidade-criada";
import { SecaoPeriodos, type ParametrosPeriodos } from "./periodos/secao-periodos";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<ParametrosPeriodos> };

export default function UnidadePage({ params, searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/unidades" prefetch={false} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para unidades
      </Button>
      <Suspense fallback={<p>Carregando unidade…</p>}>
        <ConteudoUnidade params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ConteudoUnidade({ params, searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_UNIDADES]);
  const { id } = await params;
  const unidade = await consultarUnidadeGerenciavel(id, autor);
  if (!unidade) notFound();

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
        <p className="text-sm text-muted-foreground">Altere as regras de funcionamento e de agendamento da unidade.</p>
      </div>

      <EdicaoUnidade
        acaoAlterarAtivacao={alterarAtivacao.bind(null, unidade.id)}
        acaoAtualizar={atualizarUnidade.bind(null, unidade.id)}
        ativa={unidade.ativa}
        podeAlterarAtivacao={podeAlterarAtivacaoDeUnidade(autor)}
        podeAlterarDadosAdministrativos={autor.perfil !== "SECRETARIA"}
        periodos={
          <Suspense fallback={<p>Carregando períodos letivos…</p>}>
            <SecaoPeriodos unidadeId={id} autor={autor} caminhoLista={`/cadastros/unidades/${id}`} searchParams={searchParams} />
          </Suspense>
        }
        valores={{ ...unidade, atualizadoEm: unidade.atualizadoEm.toISOString() }}
      />
    </div>
  );
}
