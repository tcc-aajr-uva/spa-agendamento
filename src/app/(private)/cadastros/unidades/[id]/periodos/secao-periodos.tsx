import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { IndicadorCarregando } from "@/components/indicador-carregando";
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
import { hrefDeEdicao } from "../../../../parametros";
import { DetalhePeriodo } from "./[periodoId]/detalhe-periodo";
import { NotificacaoPeriodo } from "./notificacao-periodo";
import { ConteudoNovoPeriodo } from "./novo/conteudo-novo-periodo";

export type ParametrosPeriodos = ParametrosBusca;

type Props = {
  unidadeId: string;
  autor: ContextoAutorizacao;
  caminhoLista: string;
  searchParams: Promise<ParametrosPeriodos>;
};

const AVISOS = ["periodoSalvo", "excluido", "confirmacaoPeriodo"];

export async function SecaoPeriodos({ unidadeId, autor, caminhoLista, searchParams }: Props) {
  const consulta = await searchParams;
  const podeGerenciar = podeGerenciarPeriodos(autor);
  const periodoAberto = valorUnico(consulta.periodo);
  const novoAberto = podeGerenciar && valorUnico(consulta.novoPeriodo) === "1";

  function caminhoSemPeriodo() {
    const parametros = criarParametrosBusca(consulta);
    for (const chave of ["periodo", "novoPeriodo", ...AVISOS]) parametros.delete(chave);
    const texto = parametros.toString();
    return texto ? `${caminhoLista}?${texto}` : caminhoLista;
  }

  if (periodoAberto || novoAberto) {
    return (
      <section id="periodos" aria-label="Períodos letivos" className="space-y-4">
        <Button variant="ghost" nativeButton={false} render={<Link href={caminhoSemPeriodo()} scroll={false} prefetch={false} />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar para a lista
        </Button>
        {periodoAberto ? (
          <Suspense fallback={<IndicadorCarregando texto="Carregando período letivo…" />}>
            <DetalhePeriodo unidadeId={unidadeId} periodoId={periodoAberto} caminhoLista={caminhoSemPeriodo()} />
          </Suspense>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Novo período letivo</h2>
            <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
              <ConteudoNovoPeriodo id={unidadeId} />
            </Suspense>
          </div>
        )}
      </section>
    );
  }

  const situacao = situacaoPeriodoSchema.catch("TODOS").parse(valorUnico(consulta.periodosSituacao));
  const resultado = await listarPeriodos(unidadeId, { situacao, pagina: valorUnico(consulta.periodosPagina) ?? "1" }, autor);
  const salvo = periodoIdSchema.safeParse(valorUnico(consulta.periodoSalvo));
  const excluido = periodoIdSchema.safeParse(valorUnico(consulta.excluido));
  const confirmacao = valorUnico(consulta.confirmacaoPeriodo) ?? "";

  function hrefDoPeriodo(periodoId: string) {
    return hrefDeEdicao(caminhoLista, consulta, "periodo", periodoId, AVISOS);
  }

  function urlDaPagina(pagina: number) {
    const parametros = criarParametrosBusca(consulta);
    for (const chave of AVISOS) parametros.delete(chave);
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
          {podeGerenciar && (
            <Button size="lg" nativeButton={false} render={<Link href={hrefDeEdicao(caminhoLista, consulta, "novoPeriodo", "1", AVISOS)} scroll={false} prefetch={false} />}>
              Novo período
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {salvo.success && <NotificacaoPeriodo key={`salvo:${salvo.data}:${confirmacao}`} parametro="periodoSalvo" periodoId={salvo.data} confirmacao={confirmacao} />}
          {excluido.success && <NotificacaoPeriodo key={`excluido:${excluido.data}:${confirmacao}`} parametro="excluido" periodoId={excluido.data} confirmacao={confirmacao} />}
          <FiltrosPeriodos situacaoInicial={resultado.situacao} />
          <ListaPeriodos periodos={resultado.periodos} hrefDoPeriodo={hrefDoPeriodo} />
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
