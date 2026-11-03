import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarPeriodo } from "@/lib/periodo-letivo/consultar-periodo";
import { ROTULOS_SITUACAO_PERIODO } from "@/lib/periodo-letivo/dados-periodo";
import { PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { atualizarPeriodo, excluirPeriodo } from "../actions";
import { FormularioPeriodo } from "../formulario-periodo";
import { ControleExclusaoPeriodo } from "../controle-exclusao";

type Props = { params: Promise<{ id: string; periodoId: string }> };

export default function PeriodoPage(props: Props) {
  return <section className="mx-auto w-full max-w-7xl space-y-6"><Suspense fallback={<p>Carregando período letivo…</p>}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params }: Props) {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  const { id, periodoId } = await params;
  const periodo = await consultarPeriodo(id, periodoId, autor);
  if (!periodo) notFound();
  const valores = { inicio: periodo.inicio, fim: periodo.fim };
  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link prefetch={false} href={`/cadastros/unidades/${id}#periodos`} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para unidade
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">Período letivo</h1>
        <Badge variant={periodo.situacao === "EM_ANDAMENTO" ? "default" : periodo.situacao === "FUTURO" ? "accent" : "outline"}>
          {ROTULOS_SITUACAO_PERIODO[periodo.situacao]}
        </Badge>
      </div>
      <FormularioPeriodo acao={atualizarPeriodo.bind(null, id, periodoId)} valores={valores}
        unidade={periodo.unidade.nome} somenteLeitura={!periodo.podeEditar} emUso={periodo.emUso} />
      {periodo.podeGerenciar && <ControleExclusaoPeriodo
        acao={excluirPeriodo.bind(null, id, periodoId)} valores={valores} motivosBloqueio={periodo.motivosBloqueioExclusao}
      />}
    </div>
  );
}
