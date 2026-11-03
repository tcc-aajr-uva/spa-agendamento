import { Suspense } from "react";
import Link from "next/link";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_GESTAO_PERIODOS } from "@/lib/periodo-letivo/escopo-periodo";
import { listarUnidadesDosPeriodos } from "@/lib/periodo-letivo/listar-periodos";
import { AtualizarAoFocar } from "../../atualizar-ao-focar";

type Props = { searchParams: Promise<{ pagina?: string | string[] }> };

export default function UnidadesDosPeriodosPage(props: Props) {
  return (
    <section className="space-y-6">
      <AtualizarAoFocar />
      <h1 className="text-2xl font-bold">Períodos letivos</h1>
      <Suspense fallback={<p>Carregando unidades…</p>}><Conteudo {...props} /></Suspense>
    </section>
  );
}

async function Conteudo({ searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_GESTAO_PERIODOS]);
  const consulta = await searchParams;
  const pagina = Array.isArray(consulta.pagina) ? consulta.pagina[0] : consulta.pagina;
  const resultado = await listarUnidadesDosPeriodos(pagina, autor);
  return (
    <div className="space-y-6">
      <p>Selecione uma unidade para consultar seus períodos letivos.</p>
      {resultado.unidades.length === 0 ? <p>Nenhuma unidade disponível no seu escopo.</p> : (
        <ul className="divide-y rounded border">
          {resultado.unidades.map((unidade) => (
            <li className="p-4" key={unidade.id}>
              <Link className="underline" prefetch={false} href={`/cadastros/unidades/${unidade.id}/periodos`}>{unidade.nome}{!unidade.ativa && " (inativa)"}</Link>
            </li>
          ))}
        </ul>
      )}
      <nav className="flex flex-wrap items-center gap-3" aria-label="Paginação">
        {resultado.pagina > 1 && <Link className="underline" prefetch={false} href={`/cadastros/periodos?pagina=${resultado.pagina - 1}`}>Anterior</Link>}
        <span>Página {resultado.pagina} de {resultado.totalPaginas}</span>
        {resultado.pagina < resultado.totalPaginas && <Link className="underline" prefetch={false} href={`/cadastros/periodos?pagina=${resultado.pagina + 1}`}>Próxima</Link>}
      </nav>
    </div>
  );
}
