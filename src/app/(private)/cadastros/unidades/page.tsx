import { Suspense } from "react";
import { CalendarRangeIcon, PencilIcon, PowerIcon } from "lucide-react";

import { CabecalhoListagem } from "@/components/cabecalho-listagem";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_UNIDADES, podeAlterarAtivacaoDeUnidade } from "@/lib/unidade/escopo-unidade";
import { listarUnidades } from "@/lib/unidade/listar-unidades";
import { FiltrosUnidades } from "./filtros-unidades";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { BotaoEdicao, ModalEdicao } from "../../modal-edicao";
import { ModalFormulario } from "../../modal-formulario";
import { hrefDeEdicao } from "../../parametros";
import { DetalheUnidade } from "./[id]/detalhe-unidade";
import { ConteudoNovaUnidade } from "./nova/conteudo-nova-unidade";

type Props = {
  searchParams: Promise<ParametrosBusca>;
};

const PARAMETROS_DOS_PERIODOS = ["periodos", "periodo", "periodosSituacao", "periodosPagina", "periodoSalvo", "excluido", "confirmacaoPeriodo"];
const PARAMETROS_DOS_MODAIS = ["editar", "ativacao", "unidadeCriada", ...PARAMETROS_DOS_PERIODOS];

export default function UnidadesPage({ searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Suspense fallback={<IndicadorCarregando texto="Carregando unidades…" />}>
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
  const editar = valorUnico(parametros.editar);
  const ativacao = valorUnico(parametros.ativacao);
  const periodos = valorUnico(parametros.periodos);
  const podeAtivar = podeAlterarAtivacaoDeUnidade(autor);
  const hrefDoModal = (chave: string, id: string) => hrefDeEdicao("/cadastros/unidades", parametros, chave, id, PARAMETROS_DOS_MODAIS);

  return (
    <div className="space-y-6">
      <CabecalhoListagem
        titulo="Unidades"
        descricao="Gerencie as unidades disponíveis no seu escopo de atuação."
        acao={resultado.podeCriar && (
          <ModalFormulario rotulo="Nova unidade" titulo="Nova unidade" descricao="Cadastre a unidade e defina suas regras de agendamento.">
            <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
              <ConteudoNovaUnidade />
            </Suspense>
          </ModalFormulario>
        )}
      />

      <FiltrosUnidades
        buscaInicial={resultado.busca}
        permitirInativas={resultado.podeFiltrarInativas}
        statusInicial={resultado.status}
      />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table aria-label="Unidades" className="min-w-185">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Nome</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col">Agendamento</TableHead>
              <TableHead scope="col">Podem agendar</TableHead>
              <TableHead scope="col" className="w-32 px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.unidades.length === 0 ? (
              <EstadoVazioTabela
                colunas={5}
                titulo="Nenhuma unidade encontrada."
                descricao="Altere ou limpe os filtros para tentar novamente."
              />
            ) : resultado.unidades.map((unidade) => (
              <TableRow key={unidade.id}>
                <TableHead scope="row" className="min-w-44 max-w-sm whitespace-normal wrap-break-word px-4 py-4 font-medium">
                  {unidade.nome}
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
                <TableCell className="px-4">
                  <div className="flex justify-center gap-1">
                    <BotaoEdicao parametro="editar" tom="editar" href={hrefDoModal("editar", unidade.id)} rotulo={`Editar ${unidade.nome}`}>
                      <PencilIcon />
                    </BotaoEdicao>
                    <BotaoEdicao parametro="periodos" tom="lista" href={hrefDoModal("periodos", unidade.id)} rotulo={`Períodos letivos de ${unidade.nome}`}>
                      <CalendarRangeIcon />
                    </BotaoEdicao>
                    {podeAtivar && (
                      <BotaoEdicao parametro="ativacao" tom={unidade.ativa ? "inativar" : "ativar"} href={hrefDoModal("ativacao", unidade.id)} rotulo={`${unidade.ativa ? "Inativar" : "Ativar"} ${unidade.nome}`}>
                        <PowerIcon />
                      </BotaoEdicao>
                    )}
                  </div>
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

      <ModalEdicao parametro="editar" aberto={Boolean(editar)} titulo="Editar unidade" limpar={["editar", "unidadeCriada"]}>
        {editar && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando unidade…" />}>
            <DetalheUnidade id={editar} caminhoLista="/cadastros/unidades" searchParams={searchParams} secao="dados" />
          </Suspense>
        )}
      </ModalEdicao>
      <ModalEdicao parametro="periodos" aberto={Boolean(periodos)} titulo="Períodos letivos" limpar={PARAMETROS_DOS_PERIODOS}>
        {periodos && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando períodos letivos…" />}>
            <DetalheUnidade id={periodos} caminhoLista="/cadastros/unidades" searchParams={searchParams} secao="periodos" />
          </Suspense>
        )}
      </ModalEdicao>
      <ModalEdicao parametro="ativacao" aberto={Boolean(ativacao)} titulo="Ativar ou inativar unidade" limpar={["ativacao"]}>
        {ativacao && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando unidade…" />}>
            <DetalheUnidade id={ativacao} caminhoLista="/cadastros/unidades" searchParams={searchParams} secao="ativacao" />
          </Suspense>
        )}
      </ModalEdicao>
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
