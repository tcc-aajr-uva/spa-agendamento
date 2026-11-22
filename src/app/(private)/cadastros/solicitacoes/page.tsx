import { Suspense } from "react";

import { CabecalhoListagem } from "@/components/cabecalho-listagem";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarSolicitacoes } from "@/lib/solicitacao-acesso/listar-solicitacoes";
import {
  rotuloDoStatusSolicitacao,
  SITUACAO_PADRAO_SOLICITACAO,
  situacaoSolicitacaoSchema,
  type SituacaoSolicitacao,
} from "@/lib/solicitacao-acesso/situacao-listagem";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { formatarDataHora } from "../../formatar";
import { perfisDaRota } from "../../menu";
import { primeiro } from "../../parametros";
import { FiltrosSolicitacoes } from "./filtros-solicitacoes";

type Props = {
  searchParams: Promise<ParametrosBusca>;
};

export default function SolicitacoesPage({ searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <CabecalhoListagem
        titulo="Solicitações de acesso"
        descricao="Aprove ou recuse os pedidos de acesso enviados pelos estagiários."
      />

      <Suspense fallback={<IndicadorCarregando texto="Carregando solicitações…" />}>
        <ListaSolicitacoes searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ListaSolicitacoes({ searchParams }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros/solicitacoes"));
  const parametros = await searchParams;
  const resultado = await listarSolicitacoes({
    busca: primeiro(parametros.busca) ?? "",
    pagina: primeiro(parametros.pagina) ?? "1",
    status: situacaoSolicitacaoSchema.parse(primeiro(parametros.status)),
  }, autor);
  const { busca, status } = resultado;

  return (
    <div className="space-y-6">
      <FiltrosSolicitacoes buscaInicial={busca} statusInicial={status} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table aria-label="Solicitações de acesso" className="min-w-225">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Solicitante</TableHead>
              <TableHead scope="col">Unidade</TableHead>
              <TableHead scope="col">Solicitada em</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col" className="px-4">Decisão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.solicitacoes.length === 0 ? (
              <EstadoVazioTabela
                colunas={5}
                titulo="Nenhuma solicitação encontrada."
                descricao={busca || status !== SITUACAO_PADRAO_SOLICITACAO
                  ? "Altere ou limpe os filtros para tentar novamente."
                  : "Não há solicitações aguardando análise."}
              />
            ) : resultado.solicitacoes.map((solicitacao) => (
              <TableRow key={solicitacao.id}>
                <TableHead scope="row" className="min-w-52 whitespace-normal px-4 py-4">
                  <div className="space-y-1">
                    <span className="font-medium">{solicitacao.nome}</span>
                    <p className="font-normal text-muted-foreground">{solicitacao.email}</p>
                  </div>
                </TableHead>
                <TableCell>{solicitacao.unidade}</TableCell>
                <TableCell>{formatarDataHora(solicitacao.criadoEm)}</TableCell>
                <TableCell>
                  <Badge variant={solicitacao.status === "PENDENTE" ? "default" : solicitacao.status === "RECUSADA" ? "destructive" : "outline"}>
                    {rotuloDoStatusSolicitacao(solicitacao.status)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-sm whitespace-normal px-4 text-muted-foreground">
                  {solicitacao.decididoEm ? (
                    <div className="space-y-1">
                      <p>
                        {rotuloDoStatusSolicitacao(solicitacao.status)}
                        {solicitacao.decididoPor && ` por ${solicitacao.decididoPor}`} em {formatarDataHora(solicitacao.decididoEm)}
                      </p>
                      {solicitacao.motivoRecusa && <p>Motivo: {solicitacao.motivoRecusa}</p>}
                    </div>
                  ) : "—"}
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
        rotuloTotal="solicitação(ões)"
        ariaLabel="Paginação das solicitações"
        href={(pagina) => urlDaPagina(pagina, busca, status)}
      />
    </div>
  );
}

function urlDaPagina(pagina: number, busca: string, status: SituacaoSolicitacao): string {
  const parametros = new URLSearchParams({ pagina: String(pagina) });
  if (status !== SITUACAO_PADRAO_SOLICITACAO) parametros.set("status", status);
  if (busca) parametros.set("busca", busca);
  return `/cadastros/solicitacoes?${parametros}`;
}
