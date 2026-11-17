import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeDosPeriodos, PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { criarPeriodo } from "../actions";
import { FormularioPeriodo } from "../formulario-periodo";

export async function ConteudoNovoPeriodo({ id }: { id: string }) {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  const unidade = await consultarUnidadeDosPeriodos(id, autor);
  if (!unidade) notFound();
  return <FormularioPeriodo acao={criarPeriodo.bind(null, id)} unidade={unidade.nome} />;
}
