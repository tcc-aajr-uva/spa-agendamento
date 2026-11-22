import { Suspense } from "react";
import { CheckIcon, XIcon } from "lucide-react";

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
import { BotaoEdicao, ModalEdicao } from "../../modal-edicao";
import { hrefDeEdicao, primeiro } from "../../parametros";
import { DetalheSolicitacao } from "./detalhe-solicitacao";
import { FiltrosSolicitacoes } from "./filtros-solicitacoes";

type Props = {
  searchParams: Promise<ParametrosBusca>;
};

const MODAIS = [
  { parametro: "aprovar", titulo: "Aprovar solicitação" },
  { parametro: "recusar", titulo: "Recusar solicitação" },
] as const;

const PARAMETROS_DOS_MODAIS = MODAIS.map((modal) => modal.parametro);

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
  const hrefDoModal = (chave: string, id: string) =>
    hrefDeEdicao("/cadastros/solicitacoes", parametros, chave, id, PARAMETROS_DOS_MODAIS);

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
              <TableHead scope="col">Decisão</TableHead>
              <TableHead scope="col" className="w-28 px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.solicitacoes.length === 0 ? (
              <EstadoVazioTabela
                colunas={6}
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
                <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
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
                <TableCell className="px-4">
                  {solicitacao.status === "PENDENTE" && (
                    <div className="flex justify-center gap-1">
                      <BotaoEdicao parametro="aprovar" tom="ativar" href={hrefDoModal("aprovar", solicitacao.id)}
                        rotulo={`Aprovar a solicitação de ${solicitacao.nome}`}>
                        <CheckIcon />
                      </BotaoEdicao>
                      <BotaoEdicao parametro="recusar" tom="inativar" href={hrefDoModal("recusar", solicitacao.id)}
                        rotulo={`Recusar a solicitação de ${solicitacao.nome}`}>
                        <XIcon />
                      </BotaoEdicao>
                    </div>
                  )}
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

      {MODAIS.map((modal) => {
        const id = primeiro(parametros[modal.parametro]);
        return (
          <ModalEdicao key={modal.parametro} parametro={modal.parametro} aberto={Boolean(id)} titulo={modal.titulo} limpar={[modal.parametro]}>
            {id && (
              <Suspense fallback={<IndicadorCarregando texto="Carregando solicitação…" />}>
                <DetalheSolicitacao id={id} secao={modal.parametro} />
              </Suspense>
            )}
          </ModalEdicao>
        );
      })}
    </div>
  );
}

function urlDaPagina(pagina: number, busca: string, status: SituacaoSolicitacao): string {
  const parametros = new URLSearchParams({ pagina: String(pagina) });
  if (status !== SITUACAO_PADRAO_SOLICITACAO) parametros.set("status", status);
  if (busca) parametros.set("busca", busca);
  return `/cadastros/solicitacoes?${parametros}`;
}
