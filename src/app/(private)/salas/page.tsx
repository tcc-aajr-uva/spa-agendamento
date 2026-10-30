import Link from "next/link";
import { exigirUsuario, filtroDeUnidade } from "@/lib/auth/permissao";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { BotaoSituacaoSala, FormularioNovaSala } from "./formularios-sala";
import { OcupacaoSalas } from "./ocupacao-salas";

const SALAS_POR_PAGINA = 10;

type Parametros = Promise<Record<string, string | string[] | undefined>>;

export default function SalasPage({ searchParams }: PageProps<"/salas">) {
  return (
    <PaginaModulo titulo="Salas" card="#2" pendente="nada nesta tela.">
      <Salas searchParams={searchParams} />
    </PaginaModulo>
  );
}

async function Salas({ searchParams }: { searchParams: Parametros }) {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  const parametros = await searchParams;
  const pagina = numeroDaUrl(parametros.pagina, 1, 1, 10_000);

  const [salasDaPagina, unidades] = await Promise.all([
    prisma.sala.findMany({
      where: filtroDeUnidade(usuario),
      orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
      skip: (pagina - 1) * SALAS_POR_PAGINA,
      // Uma a mais só para saber se existe próxima página, sem um count separado.
      take: SALAS_POR_PAGINA + 1,
      select: { id: true, nome: true, ativa: true, unidade: { select: { nome: true } } },
    }),
    // Só a coordenação geral (sem unidade) escolhe a unidade da sala nova.
    usuario.unidadeId === null
      ? prisma.unidade.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } })
      : null,
  ]);
  const salas = salasDaPagina.slice(0, SALAS_POR_PAGINA);
  const temProxima = salasDaPagina.length > SALAS_POR_PAGINA;

  const unidadeOcupacao = usuario.unidadeId ?? escolherUnidade(parametros.unidade, unidades);
  const dia = numeroDaUrl(parametros.dia, 1, 1, 6);
  const link = (mudanca: Record<string, number | string>) => {
    const novos = new URLSearchParams({ pagina: String(pagina), dia: String(dia), unidade: unidadeOcupacao ?? "" });
    for (const [chave, valor] of Object.entries(mudanca)) novos.set(chave, String(valor));
    return `/salas?${novos}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {salas.length === 0 ? (
        <p>{pagina === 1 ? "Nenhuma sala cadastrada ainda." : "Nenhuma sala nesta página."}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {salas.map((sala) => (
            <li key={sala.id} className="flex flex-wrap items-center gap-2">
              <span>
                {sala.unidade.nome} — {sala.nome} {sala.ativa ? "" : "(inativa)"}
              </span>
              <BotaoSituacaoSala salaId={sala.id} nome={sala.nome} ativa={sala.ativa} />
            </li>
          ))}
        </ul>
      )}
      {(pagina > 1 || temProxima) && (
        <nav aria-label="Páginas de salas" className="flex gap-4">
          {pagina > 1 && <Link className="underline" href={link({ pagina: pagina - 1 })}>Anterior</Link>}
          <span>Página {pagina}</span>
          {temProxima && <Link className="underline" href={link({ pagina: pagina + 1 })}>Próxima</Link>}
        </nav>
      )}
      <section className="flex max-w-md flex-col gap-2">
        <h2 className="text-lg font-bold">Nova sala</h2>
        <FormularioNovaSala unidades={unidades} />
      </section>
      {unidadeOcupacao && (
        <OcupacaoSalas unidadeId={unidadeOcupacao} dia={dia} unidades={unidades} link={link} />
      )}
    </div>
  );
}

function escolherUnidade(valor: unknown, unidades: { id: string }[] | null): string | null {
  return unidades?.find((unidade) => unidade.id === valor)?.id ?? unidades?.[0]?.id ?? null;
}

function numeroDaUrl(valor: unknown, padrao: number, minimo: number, maximo: number): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : padrao;
}
