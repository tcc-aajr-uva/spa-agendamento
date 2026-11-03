import { Suspense } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Suspense fallback={<p>Carregando equipes…</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Equipes</h1>
          <p className="text-sm text-muted-foreground">Consulte as equipes do seu escopo de atuação.</p>
        </div>
        {resultado.podeGerenciar && (
          <Button size="lg" nativeButton={false} render={<Link href="/cadastros/equipes/nova" prefetch={false} />}>
            Nova equipe
          </Button>
        )}
      </div>
      <FiltrosEquipes
        buscaInicial={resultado.busca}
        unidadeInicial={resultado.unidadeId}
        statusInicial={resultado.status}
        permitirInativas={resultado.podeGerenciar}
        unidades={unidades}
      />
      <div className="overflow-hidden rounded-lg border">
        <Table aria-label="Equipes" className="min-w-185">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Nome</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col">Unidade</TableHead>
              <TableHead scope="col">Supervisor</TableHead>
              <TableHead scope="col" className="w-10 px-4" aria-label="Detalhes da equipe" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.equipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 whitespace-normal text-center">
                  <div className="space-y-1">
                    <p className="font-medium">Nenhuma equipe encontrada.</p>
                    <p className="text-muted-foreground">Altere ou limpe os filtros para tentar novamente.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : resultado.equipes.map((equipe) => (
              <TableRow key={equipe.id} className="relative">
                <TableHead scope="row" className="min-w-44 max-w-sm whitespace-normal wrap-break-word px-4 py-4">
                  <Link
                    className="font-medium underline-offset-4 hover:underline after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                    href={`/cadastros/equipes/${equipe.id}`}
                    prefetch={false}
                  >
                    {equipe.nome}
                  </Link>
                </TableHead>
                <TableCell>
                  <Badge variant={equipe.ativa ? "default" : "outline"}>{equipe.ativa ? "Ativa" : "Inativa"}</Badge>
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {equipe.unidade.nome}{!equipe.unidade.ativa && " (inativa)"}
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {equipe.supervisor?.nome ?? "Não definido"}{equipe.supervisor && !equipe.supervisor.ativo && " (inativo)"}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <ChevronRightIcon aria-hidden="true" className="ml-auto size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginacaoLista
        pagina={resultado.pagina}
        totalPaginas={resultado.totalPaginas}
        total={resultado.total}
        rotuloTotal="equipe(s)"
        ariaLabel="Paginação das equipes"
        href={(pagina) => urlDaPagina(pagina, resultado.busca, resultado.unidadeId, resultado.status)}
      />
    </div>
  );
}

function valorUnico(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

function urlDaPagina(pagina: number, busca: string, unidadeId: string, status: string): string {
  const parametros = new URLSearchParams({ pagina: String(pagina), status });
  if (busca) parametros.set("busca", busca);
  if (unidadeId) parametros.set("unidadeId", unidadeId);
  return `/cadastros/equipes?${parametros}`;
}
