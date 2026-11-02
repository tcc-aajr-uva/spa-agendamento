import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeDosPeriodos, PERFIS_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { SecaoPeriodos, type ParametrosPeriodos } from "./secao-periodos";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosPeriodos>;
};

export default function PeriodosPage(props: Props) {
  return <section className="space-y-6"><Suspense fallback={<p>Carregando períodos letivos…</p>}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params, searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_PERIODOS]);
  const { id } = await params;
  const unidade = await consultarUnidadeDosPeriodos(id, autor);
  if (!unidade) notFound();
  if (autor.perfil !== "SUPERVISOR") {
    const consulta = await searchParams;
    const parametros = new URLSearchParams();
    for (const [chave, valor] of Object.entries(consulta)) {
      if (Array.isArray(valor)) valor.forEach((item) => parametros.append(chave, item));
      else if (valor !== undefined) parametros.set(chave, valor);
    }
    const caminho = `/cadastros/unidades/${id}`;
    redirect(`${caminho}${parametros.size ? `?${parametros}` : ""}#periodos`);
  }
  return (
    <div className="space-y-6">
      <Link className="underline" prefetch={false} href="/cadastros/periodos">Voltar para minhas unidades</Link>
      <h1 className="text-2xl font-bold">{unidade.nome}</h1>
      <SecaoPeriodos unidadeId={id} autor={autor} caminhoLista={`/cadastros/unidades/${id}/periodos`} searchParams={searchParams} />
    </div>
  );
}

