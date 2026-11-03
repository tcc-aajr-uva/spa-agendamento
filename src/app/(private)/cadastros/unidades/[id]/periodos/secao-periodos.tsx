import "server-only";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginacaoLista } from "@/components/paginacao-lista";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { listarPeriodos } from "@/lib/periodo-letivo/listar-periodos";
import { periodoIdSchema, situacaoPeriodoSchema } from "@/lib/periodo-letivo/dados-periodo";
import { podeGerenciarPeriodos } from "@/lib/periodo-letivo/escopo-periodo";
import { criarParametrosBusca, type ParametrosBusca } from "@/lib/url/parametros-busca";
import { FiltrosPeriodos } from "./filtros-periodos";
import { ListaPeriodos } from "./lista-periodos";
import { NotificacaoPeriodo } from "./notificacao-periodo";

export type ParametrosPeriodos = ParametrosBusca;

type Props = {
  unidadeId: string;
  autor: ContextoAutorizacao;
  caminhoLista: string;
  searchParams: Promise<ParametrosPeriodos>;
};

export async function SecaoPeriodos({ unidadeId, autor, caminhoLista, searchParams }: Props) {
  const consulta = await searchParams;
  const situacao = situacaoPeriodoSchema.catch("TODOS").parse(valorUnico(consulta.periodosSituacao));
  const resultado = await listarPeriodos(unidadeId, { situacao, pagina: valorUnico(consulta.periodosPagina) ?? "1" }, autor);
  const salvo = periodoIdSchema.safeParse(valorUnico(consulta.periodoSalvo));
  const excluido = periodoIdSchema.safeParse(valorUnico(consulta.excluido));
  const confirmacao = valorUnico(consulta.confirmacaoPeriodo) ?? "";
  const caminhoDetalhes = `/cadastros/unidades/${unidadeId}/periodos`;

  function urlDaPagina(pagina: number) {
    const parametros = criarParametrosBusca(consulta);
    parametros.delete("periodoSalvo");
    parametros.delete("excluido");
    parametros.delete("confirmacaoPeriodo");
    parametros.set("periodosPagina", String(pagina));
    return `${caminhoLista}?${parametros}#periodos`;
  }

  return (
    <section id="periodos" aria-label="Períodos letivos">
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle><h2>Períodos letivos</h2></CardTitle>
            <CardDescription>Gerencie as datas dos períodos letivos desta unidade.</CardDescription>
          </div>
          {podeGerenciarPeriodos(autor) && (
            <Button size="lg" nativeButton={false} render={<Link prefetch={false} href={`${caminhoDetalhes}/novo`} />}>
              Novo período
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {salvo.success && <NotificacaoPeriodo key={`salvo:${salvo.data}:${confirmacao}`} parametro="periodoSalvo" periodoId={salvo.data} confirmacao={confirmacao} />}
          {excluido.success && <NotificacaoPeriodo key={`excluido:${excluido.data}:${confirmacao}`} parametro="excluido" periodoId={excluido.data} confirmacao={confirmacao} />}
          <FiltrosPeriodos situacaoInicial={resultado.situacao} />
          <ListaPeriodos periodos={resultado.periodos} caminhoDetalhes={caminhoDetalhes} />
          <PaginacaoLista
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            total={resultado.total}
            rotuloTotal="período(s)"
            ariaLabel="Paginação dos períodos letivos"
            href={urlDaPagina}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function valorUnico(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}
