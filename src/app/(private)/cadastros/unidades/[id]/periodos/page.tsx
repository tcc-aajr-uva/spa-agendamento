import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeDosPeriodos, PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import type { ParametrosPeriodos } from "./secao-periodos";
import { criarParametrosBusca } from "@/lib/url/parametros-busca";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosPeriodos>;
};

export default function PeriodosPage(props: Props) {
  return <section className="space-y-6"><Suspense fallback={<p>Carregando períodos letivos…</p>}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params, searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  const { id } = await params;
  const unidade = await consultarUnidadeDosPeriodos(id, autor);
  if (!unidade) notFound();
  const consulta = await searchParams;
  const parametros = criarParametrosBusca(consulta);
  const caminho = `/cadastros/unidades/${id}`;
  return redirect(`${caminho}${parametros.size ? `?${parametros}` : ""}#periodos`);
}

