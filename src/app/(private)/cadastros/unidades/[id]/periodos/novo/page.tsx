import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeDosPeriodos, PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { criarPeriodo } from "../actions";
import { FormularioPeriodo } from "../formulario-periodo";

type Props = { params: Promise<{ id: string }> };

export default function NovoPeriodoPage(props: Props) {
  return <section className="space-y-6"><Suspense fallback={<p>Carregando formulário…</p>}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params }: Props) {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  const { id } = await params;
  const unidade = await consultarUnidadeDosPeriodos(id, autor);
  if (!unidade) notFound();
  return (
    <div className="space-y-6">
      <Link className="underline" prefetch={false} href={`/cadastros/unidades/${id}#periodos`}>Voltar para unidade</Link>
      <h1 className="text-2xl font-bold">Novo período letivo</h1>
      <FormularioPeriodo acao={criarPeriodo.bind(null, id)} unidade={unidade.nome} />
    </div>
  );
}
