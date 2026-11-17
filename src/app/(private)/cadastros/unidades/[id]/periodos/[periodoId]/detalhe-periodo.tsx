import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarPeriodo } from "@/lib/periodo-letivo/consultar-periodo";
import { ROTULOS_SITUACAO_PERIODO } from "@/lib/periodo-letivo/dados-periodo";
import { PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { atualizarPeriodo, excluirPeriodo } from "../actions";
import { FormularioPeriodo } from "../formulario-periodo";

type Props = {
  unidadeId: string;
  periodoId: string;
  caminhoLista: string;
  paginaCheia?: boolean;
};

export async function DetalhePeriodo({ unidadeId, periodoId, caminhoLista, paginaCheia = false }: Props) {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  const periodo = await consultarPeriodo(unidadeId, periodoId, autor);
  if (!periodo) {
    if (paginaCheia) notFound();
    return <p className="text-muted-foreground">Período letivo não encontrado.</p>;
  }
  const valores = { inicio: periodo.inicio, fim: periodo.fim };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">Período letivo</h1>
        <Badge variant={periodo.situacao === "EM_ANDAMENTO" ? "default" : periodo.situacao === "FUTURO" ? "accent" : "outline"}>
          {ROTULOS_SITUACAO_PERIODO[periodo.situacao]}
        </Badge>
      </div>
      <FormularioPeriodo acao={atualizarPeriodo.bind(null, unidadeId, periodoId)} valores={valores}
        caminhoLista={caminhoLista}
        unidade={periodo.unidade.nome} somenteLeitura={!periodo.podeEditar} emUso={periodo.emUso}
        exclusao={periodo.podeGerenciar ? {
          acao: excluirPeriodo.bind(null, unidadeId, periodoId),
          motivosBloqueio: periodo.motivosBloqueioExclusao,
        } : undefined} />
    </div>
  );
}
