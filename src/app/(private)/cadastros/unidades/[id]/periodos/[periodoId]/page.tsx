import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarPeriodo } from "@/lib/periodo-letivo/consultar-periodo";
import { ROTULOS_SITUACAO_PERIODO } from "@/lib/periodo-letivo/dados-periodo";
import { PERFIS_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { atualizarPeriodo, excluirPeriodo } from "../actions";
import { FormularioPeriodo } from "../formulario-periodo";
import { ControleExclusaoPeriodo } from "../controle-exclusao";

type Props = { params: Promise<{ id: string; periodoId: string }> };

export default function PeriodoPage(props: Props) {
  return <section className="space-y-6"><Suspense fallback={<p>Carregando período letivo…</p>}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params }: Props) {
  const autor = await exigirUsuario([...PERFIS_PERIODOS]);
  const { id, periodoId } = await params;
  const periodo = await consultarPeriodo(id, periodoId, autor);
  if (!periodo) notFound();
  const valores = { inicio: periodo.inicio, fim: periodo.fim };
  return (
    <div className="space-y-6">
      <Link className="underline" prefetch={false}
        href={autor.perfil === "SUPERVISOR" ? `/cadastros/unidades/${id}/periodos#periodos` : `/cadastros/unidades/${id}#periodos`}>
        Voltar para {autor.perfil === "SUPERVISOR" ? "períodos letivos" : "unidade"}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">Período letivo</h1>
        <span className="rounded border px-2 py-0.5 text-sm">{ROTULOS_SITUACAO_PERIODO[periodo.situacao]}</span>
      </div>
      <FormularioPeriodo acao={atualizarPeriodo.bind(null, id, periodoId)} valores={valores}
        unidade={periodo.unidade.nome} somenteLeitura={!periodo.podeEditar} emUso={periodo.emUso} />
      {periodo.podeGerenciar && <ControleExclusaoPeriodo
        acao={excluirPeriodo.bind(null, id, periodoId)} valores={valores} motivosBloqueio={periodo.motivosBloqueioExclusao}
      />}
    </div>
  );
}
