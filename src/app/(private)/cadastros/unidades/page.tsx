import { Suspense } from "react";
import Link from "next/link";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_UNIDADES } from "@/lib/unidade/escopo-unidade";
import { listarUnidades } from "@/lib/unidade/listar-unidades";
import { FiltrosUnidades } from "./filtros-unidades";

type Props = {
  searchParams: Promise<{ busca?: string | string[]; pagina?: string | string[]; status?: string | string[] }>;
};

export default function UnidadesPage({ searchParams }: Props) {
  return (
    <section className="space-y-6">
      <Suspense fallback={<p>Carregando unidades…</p>}>
        <ConteudoUnidades searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ConteudoUnidades({ searchParams }: Props) {
  const autor = await exigirUsuario([...PERFIS_UNIDADES]);
  const parametros = await searchParams;
  const statusInformado = valorUnico(parametros.status);
  const status = statusInformado === "INATIVAS" || statusInformado === "TODAS" ? statusInformado : "ATIVAS";
  const resultado = await listarUnidades(
    {
      busca: valorUnico(parametros.busca) ?? "",
      pagina: valorUnico(parametros.pagina) ?? "1",
      status,
    },
    autor,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Unidades</h1>
          <p className="text-sm text-gray-600">Gerencie as unidades disponíveis no seu escopo de atuação.</p>
        </div>
        {resultado.podeCriar && (
          <Link className="rounded border px-3 py-2" href="/cadastros/unidades/nova" prefetch={false}>Nova unidade</Link>
        )}
      </div>

      <FiltrosUnidades
        buscaInicial={resultado.busca}
        permitirInativas={resultado.podeFiltrarInativas}
        statusInicial={resultado.status}
      />

      {resultado.unidades.length === 0 ? (
        <div className="space-y-2 rounded border p-4">
          <strong>Nenhuma unidade encontrada.</strong>
          <p className="text-sm text-gray-600">Altere ou limpe os filtros para tentar novamente.</p>
        </div>
      ) : (
        <ul className="divide-y rounded border">
          {resultado.unidades.map((unidade) => (
            <li className="space-y-2 p-4" key={unidade.id}>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{unidade.nome}</strong>
                <span className={`rounded border px-2 py-0.5 text-sm ${unidade.ativa ? "" : "text-red-700"}`}>
                  {unidade.ativa ? "Ativa" : "Inativa"}
                </span>
                <span className="rounded border px-2 py-0.5 text-sm">
                  Agendamento {unidade.agendamentoAberto ? "aberto" : "fechado"}
                </span>
              </div>
              <p className="text-sm text-gray-600">Podem agendar: {rotuloDosAgendadores(unidade) || "ninguém"}</p>
              <Link className="inline-block underline" href={`/cadastros/unidades/${unidade.id}`} prefetch={false}>Ver detalhes</Link>
            </li>
          ))}
        </ul>
      )}

      <nav className="flex items-center gap-3" aria-label="Paginação">
        {resultado.pagina > 1 && (
          <Link className="underline" href={urlDaPagina(resultado.pagina - 1, resultado.busca, resultado.status)} prefetch={false}>Anterior</Link>
        )}
        <span>Página {resultado.pagina} de {resultado.totalPaginas} — {resultado.total} unidade(s)</span>
        {resultado.pagina < resultado.totalPaginas && (
          <Link className="underline" href={urlDaPagina(resultado.pagina + 1, resultado.busca, resultado.status)} prefetch={false}>Próxima</Link>
        )}
      </nav>
    </div>
  );
}

function valorUnico(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function urlDaPagina(pagina: number, busca: string, status: string): string {
  const parametros = new URLSearchParams({ pagina: String(pagina), status });
  if (busca) parametros.set("busca", busca);
  return `/cadastros/unidades?${parametros}`;
}

function rotuloDosAgendadores(unidade: {
  permitePaciente: boolean;
  permiteEstagiario: boolean;
  permiteSecretaria: boolean;
}): string {
  return [
    unidade.permitePaciente && "paciente",
    unidade.permiteEstagiario && "estagiário",
    unidade.permiteSecretaria && "secretaria",
  ].filter(Boolean).join(", ");
}
