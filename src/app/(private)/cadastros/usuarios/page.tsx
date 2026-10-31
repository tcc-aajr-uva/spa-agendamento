import { Suspense } from "react";
import Link from "next/link";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUsuarios } from "@/lib/usuario/listar-usuarios";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { perfisDaRota } from "../../menu";
import { FiltrosUsuarios } from "./filtros-usuarios";

type Props = {
  searchParams: Promise<{ busca?: string | string[]; pagina?: string | string[]; status?: string | string[] }>;
};

export default function UsuariosPage({ searchParams }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-gray-600">Consulte os usuários que pertencem ao seu escopo de atuação.</p>
        </div>
        <Link className="rounded border px-3 py-2" href="/cadastros/usuarios/novo">
          Novo usuário
        </Link>
      </div>

      <Suspense fallback={<p>Carregando usuários…</p>}>
        <ListaUsuarios searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ListaUsuarios({ searchParams }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const parametros = await searchParams;
  const busca = valorUnico(parametros.busca) ?? "";
  const pagina = valorUnico(parametros.pagina) ?? "1";
  const statusInformado = valorUnico(parametros.status);
  const status = statusInformado === "INATIVOS" || statusInformado === "TODOS" ? statusInformado : "ATIVOS";
  const resultado = await listarUsuarios({ busca, pagina, status }, autor);

  return (
    <div className="space-y-4">
      <FiltrosUsuarios buscaInicial={busca} statusInicial={status} />

      {resultado.usuarios.length === 0 ? (
        <div className="space-y-2 rounded border p-4">
          <strong>Nenhum usuário encontrado.</strong>
          <p className="text-sm text-gray-600">
            {busca || status !== "ATIVOS"
              ? "Altere ou limpe os filtros para tentar novamente."
              : "Crie o primeiro usuário disponível para o seu perfil."}
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded border">
          {resultado.usuarios.map((usuario) => (
            <li className="space-y-1 p-4" key={usuario.id}>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{usuario.nome}</strong>
                <span className="rounded border px-2 py-0.5 text-sm">{rotuloDoPerfil(usuario.perfil)}</span>
                <span className={`rounded border px-2 py-0.5 text-sm ${usuario.ativo ? "" : "text-red-700"}`}>
                  {usuario.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="text-sm">{usuario.email}</p>
              <p className="text-sm text-gray-600">Unidades: {usuario.unidades.join(", ") || "nenhuma"}</p>
              {usuario.equipes.length > 0 && (
                <p className="text-sm text-gray-600">Equipes: {usuario.equipes.join(", ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <nav className="flex items-center gap-3" aria-label="Paginação">
        {resultado.pagina > 1 && (
          <Link className="underline" href={urlDaPagina(resultado.pagina - 1, busca, status)}>
            Anterior
          </Link>
        )}
        <span>
          Página {resultado.pagina} de {resultado.totalPaginas} — {resultado.total} usuário(s)
        </span>
        {resultado.pagina < resultado.totalPaginas && (
          <Link className="underline" href={urlDaPagina(resultado.pagina + 1, busca, status)}>
            Próxima
          </Link>
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
  return `/cadastros/usuarios?${parametros}`;
}

