import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { resolverFiltros, type Parametros } from "@/lib/painel/filtros-ocupacao";
import { listarUnidadesDoPainel, obterGradeDeOcupacao } from "@/lib/painel/ocupacao";
import { GradeOcupacao } from "./grade-ocupacao";
import { SeletorOcupacao } from "./seletor-ocupacao";

type Props = {
  usuario: ContextoAutorizacao;
  agora: Date;
  parametros: Promise<Parametros>;
};

export async function Ocupacao({ usuario, agora, parametros }: Props) {
  const unidades = await listarUnidadesDoPainel(usuario);
  const { unidadeId, diaSemana } = resolverFiltros(await parametros, unidades, agora);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Ocupação</h2>
      {unidadeId === null ? (
        <p className="text-muted-foreground">Nenhuma unidade disponível.</p>
      ) : (
        <>
          <SeletorOcupacao unidades={unidades} unidadeId={unidadeId} diaSemana={diaSemana} />
          <GradeOcupacao grade={await obterGradeDeOcupacao(usuario, unidadeId, diaSemana, agora)} />
        </>
      )}
    </div>
  );
}