import "server-only";

import Link from "next/link";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { listarPeriodos } from "@/lib/periodo-letivo/listar-periodos";
import { periodoIdSchema, situacaoPeriodoSchema } from "@/lib/periodo-letivo/dados-periodo";
import { podeGerenciarPeriodos } from "@/lib/periodo-letivo/escopo-periodo";
import { MensagemSucesso } from "../../mensagem-sucesso";
import { FiltrosPeriodos } from "./filtros-periodos";
import { ListaPeriodos } from "./lista-periodos";

export type ParametrosPeriodos = Record<string, string | string[] | undefined>;

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
    const parametros = new URLSearchParams();
    for (const [chave, valor] of Object.entries(consulta)) {
      if (Array.isArray(valor)) valor.forEach((item) => parametros.append(chave, item));
      else if (valor !== undefined) parametros.set(chave, valor);
    }
    parametros.delete("periodoSalvo");
    parametros.delete("excluido");
    parametros.delete("confirmacaoPeriodo");
    parametros.set("periodosPagina", String(pagina));
    return `${caminhoLista}?${parametros}#periodos`;
  }

  return (
    <section id="periodos" className="space-y-4 rounded border p-4" aria-label="Períodos letivos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Períodos letivos</h2>
        {podeGerenciarPeriodos(autor) && <Link className="rounded border px-3 py-2" prefetch={false} href={`${caminhoDetalhes}/novo`}>Novo período</Link>}
      </div>
      {salvo.success && <MensagemSucesso key={`salvo:${salvo.data}:${confirmacao}`} texto="Período letivo salvo." />}
      {excluido.success && <MensagemSucesso key={`excluido:${excluido.data}:${confirmacao}`} texto="Período letivo excluído." />}
      <FiltrosPeriodos situacaoInicial={resultado.situacao} />
      <ListaPeriodos
        periodos={resultado.periodos} caminhoDetalhes={caminhoDetalhes}
        pagina={resultado.pagina} totalPaginas={resultado.totalPaginas} total={resultado.total}
        anterior={resultado.pagina > 1 ? urlDaPagina(resultado.pagina - 1) : undefined}
        proxima={resultado.pagina < resultado.totalPaginas ? urlDaPagina(resultado.pagina + 1) : undefined}
      />
    </section>
  );
}

function valorUnico(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}
