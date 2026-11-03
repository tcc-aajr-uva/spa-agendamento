import { Suspense } from "react";
import Link from "next/link";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUnidadesParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { listarEquipes } from "@/lib/equipe/listar-equipes";
import { FiltrosEquipes } from "./filtros-equipes";

type Props = {
  searchParams: Promise<{ busca?: string | string[]; unidadeId?: string | string[]; status?: string | string[]; pagina?: string | string[] }>;
};

export default function EquipesPage({ searchParams }: Props) {
  return (
    <section className="space-y-6">
      <Suspense fallback={<p>Carregando equipes…</p>}><Conteudo searchParams={searchParams} /></Suspense>
    </section>
  );
}

async function Conteudo({ searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const parametros = await searchParams;
  const statusInformado = valorUnico(parametros.status);
  const status = statusInformado === "INATIVAS" || statusInformado === "TODAS" ? statusInformado : "ATIVAS";
  const [resultado, unidades] = await Promise.all([
    listarEquipes({
      busca: valorUnico(parametros.busca) ?? "",
      unidadeId: valorUnico(parametros.unidadeId) ?? "",
      status,
      pagina: valorUnico(parametros.pagina) ?? "1",
    }, autor),
    listarUnidadesParaEquipe(autor, false),
  ]);

  function urlDaPagina(pagina: number) {
    const consulta = new URLSearchParams({ pagina: String(pagina), status: resultado.status });
    if (resultado.busca) consulta.set("busca", resultado.busca);
    if (resultado.unidadeId) consulta.set("unidadeId", resultado.unidadeId);
    return `/cadastros/equipes?${consulta}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Equipes</h1>
          <p className="text-sm text-gray-600">Consulte as equipes do seu escopo de atuação.</p>
        </div>
        {resultado.podeGerenciar && <Link className="rounded border px-3 py-2" href="/cadastros/equipes/nova" prefetch={false}>Nova equipe</Link>}
      </div>
      <FiltrosEquipes
        buscaInicial={resultado.busca}
        unidadeInicial={resultado.unidadeId}
        statusInicial={resultado.status}
        permitirInativas={resultado.podeGerenciar}
        unidades={unidades}
      />
      {resultado.equipes.length === 0 ? (
        <div className="space-y-2 rounded border p-4">
          <strong>Nenhuma equipe encontrada.</strong>
          <p className="text-sm text-gray-600">Verifique os filtros ou os vínculos com sua unidade e equipe.</p>
        </div>
      ) : (
        <ul className="divide-y rounded border">
          {resultado.equipes.map((equipe) => (
            <li className="space-y-2 p-4" key={equipe.id}>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{equipe.nome}</strong>
                <span className="rounded border px-2 py-0.5 text-sm">{equipe.ativa ? "Ativa" : "Inativa"}</span>
              </div>
              <p>Unidade: {equipe.unidade.nome}{!equipe.unidade.ativa && " (inativa)"}</p>
              <p>Supervisor: {equipe.supervisor?.nome ?? "Não definido"}{equipe.supervisor && !equipe.supervisor.ativo && " (inativo)"}</p>
              <Link className="inline-block underline" href={`/cadastros/equipes/${equipe.id}`} prefetch={false}>Ver detalhes</Link>
            </li>
          ))}
        </ul>
      )}
      <nav className="flex flex-wrap items-center gap-3" aria-label="Paginação">
        {resultado.pagina > 1 && <Link className="underline" href={urlDaPagina(resultado.pagina - 1)} prefetch={false}>Anterior</Link>}
        <span>Página {resultado.pagina} de {resultado.totalPaginas} — {resultado.total} equipe(s)</span>
        {resultado.pagina < resultado.totalPaginas && <Link className="underline" href={urlDaPagina(resultado.pagina + 1)} prefetch={false}>Próxima</Link>}
      </nav>
    </div>
  );
}

function valorUnico(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}
