import { Suspense } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { CabecalhoListagem } from "@/components/cabecalho-listagem";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_UNIDADES } from "@/lib/unidade/escopo-unidade";
import { listarUnidades } from "@/lib/unidade/listar-unidades";
import { FiltrosUnidades } from "./filtros-unidades";

type Props = {
  searchParams: Promise<{ busca?: string | string[]; pagina?: string | string[]; status?: string | string[] }>;
};

export default function UnidadesPage({ searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
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
      <CabecalhoListagem
        titulo="Unidades"
        descricao="Gerencie as unidades disponíveis no seu escopo de atuação."
        acao={resultado.podeCriar && (
          <Button size="lg" nativeButton={false} render={<Link href="/cadastros/unidades/nova" prefetch={false} />}>
            Nova unidade
          </Button>
        )}
      />

      <FiltrosUnidades
        buscaInicial={resultado.busca}
        permitirInativas={resultado.podeFiltrarInativas}
        statusInicial={resultado.status}
      />

      <div className="overflow-hidden rounded-lg border">
        <Table aria-label="Unidades" className="min-w-185">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Nome</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col">Agendamento</TableHead>
              <TableHead scope="col">Podem agendar</TableHead>
              <TableHead scope="col" className="w-10 px-4" aria-label="Detalhes da unidade" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.unidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 whitespace-normal text-center">
                  <div className="space-y-1">
                    <p className="font-medium">Nenhuma unidade encontrada.</p>
                    <p className="text-muted-foreground">Altere ou limpe os filtros para tentar novamente.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : resultado.unidades.map((unidade) => (
              <TableRow key={unidade.id} className="relative">
                <TableHead scope="row" className="min-w-44 max-w-sm whitespace-normal wrap-break-word px-4 py-4">
                  <Link className="font-medium underline-offset-4 hover:underline after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                    href={`/cadastros/unidades/${unidade.id}`} prefetch={false}>
                    {unidade.nome}
                  </Link>
                </TableHead>
                <TableCell>
                  <Badge variant={unidade.ativa ? "default" : "outline"}>
                    {unidade.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={unidade.agendamentoAberto ? "accent" : "outline"}>
                    {unidade.agendamentoAberto ? "Aberto" : "Fechado"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {rotuloDosAgendadores(unidade) || "ninguém"}
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
        rotuloTotal="unidade(s)"
        ariaLabel="Paginação das unidades"
        href={(pagina) => urlDaPagina(pagina, resultado.busca, resultado.status)}
      />
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
