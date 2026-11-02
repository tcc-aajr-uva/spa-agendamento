import Link from "next/link";
import { formatarDataPeriodo, ROTULOS_SITUACAO_PERIODO, type SituacaoPeriodo } from "@/lib/periodo-letivo/dados-periodo";

type Props = {
  periodos: { id: string; inicio: string; fim: string; situacao: SituacaoPeriodo }[];
  caminhoDetalhes: string;
  pagina: number;
  totalPaginas: number;
  total: number;
  anterior?: string;
  proxima?: string;
};

export function ListaPeriodos({ periodos, caminhoDetalhes, pagina, totalPaginas, total, anterior, proxima }: Props) {
  return (
    <div className="space-y-4">
      {periodos.length === 0 ? (
        <p className="rounded border p-4">Nenhum período letivo encontrado. Verifique o filtro de situação.</p>
      ) : (
        <ul className="divide-y rounded border">
          {periodos.map((periodo) => (
            <li key={periodo.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{formatarDataPeriodo(periodo.inicio)} a {formatarDataPeriodo(periodo.fim)}</strong>
                <span className="rounded border px-2 py-0.5 text-sm">{ROTULOS_SITUACAO_PERIODO[periodo.situacao]}</span>
              </div>
              <Link className="inline-block underline" prefetch={false} href={`${caminhoDetalhes}/${periodo.id}`}>Ver detalhes</Link>
            </li>
          ))}
        </ul>
      )}
      <nav className="flex flex-wrap items-center gap-3" aria-label="Paginação dos períodos letivos">
        {anterior && <Link className="underline" prefetch={false} href={anterior}>Anterior</Link>}
        <span>Página {pagina} de {totalPaginas} — {total} período(s)</span>
        {proxima && <Link className="underline" prefetch={false} href={proxima}>Próxima</Link>}
      </nav>
    </div>
  );
}
