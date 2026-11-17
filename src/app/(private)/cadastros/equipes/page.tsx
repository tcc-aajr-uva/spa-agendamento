import { Suspense } from "react";
import { PencilIcon, PowerIcon, UsersIcon } from "lucide-react";

import { CabecalhoListagem } from "@/components/cabecalho-listagem";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { Badge } from "@/components/ui/badge";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUnidadesParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_EQUIPES, podeConsultarEstagiariosDaEquipe } from "@/lib/equipe/escopo-equipe";
import { listarEquipes } from "@/lib/equipe/listar-equipes";
import { FiltrosEquipes } from "./filtros-equipes";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { BotaoEdicao, ModalEdicao } from "../../modal-edicao";
import { ModalFormulario } from "../../modal-formulario";
import { hrefDeEdicao } from "../../parametros";
import { DetalheEquipe } from "./[id]/detalhe-equipe";
import { ConteudoNovaEquipe } from "./nova/conteudo-nova-equipe";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { EstagiariosEquipe } from "./estagiarios-equipe";

type Props = {
  searchParams: Promise<ParametrosBusca>;
};

const PARAMETROS_DOS_ESTAGIARIOS = ["estagiarios", "buscaEstagiarios", "paginaEstagiarios"];
const PARAMETROS_DOS_MODAIS = ["editar", "ativacao", "equipeCriada", ...PARAMETROS_DOS_ESTAGIARIOS];

export default function EquipesPage({ searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Suspense fallback={<IndicadorCarregando texto="Carregando equipes…" />}>
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
  const editar = valorUnico(parametros.editar);
  const ativacao = valorUnico(parametros.ativacao);
  const estagiarios = valorUnico(parametros.estagiarios);
  const podeConsultarEstagiarios = podeConsultarEstagiariosDaEquipe(autor);
  const hrefDoModal = (chave: string, id: string) => hrefDeEdicao("/cadastros/equipes", parametros, chave, id, PARAMETROS_DOS_MODAIS);

  return (
    <div className="space-y-6">
      <CabecalhoListagem
        titulo="Equipes"
        descricao="Consulte as equipes do seu escopo de atuação."
        acao={resultado.podeGerenciar && (
          <ModalFormulario rotulo="Nova equipe" titulo="Nova equipe" descricao="Cadastre a equipe e defina sua unidade e supervisão responsável.">
            <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
              <ConteudoNovaEquipe />
            </Suspense>
          </ModalFormulario>
        )}
      />
      <FiltrosEquipes
        buscaInicial={resultado.busca}
        unidadeInicial={resultado.unidadeId}
        statusInicial={resultado.status}
        permitirInativas={resultado.podeGerenciar}
        unidades={unidades}
      />
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table aria-label="Equipes" className="min-w-185">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Nome</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col">Unidade</TableHead>
              <TableHead scope="col">Supervisor</TableHead>
              <TableHead scope="col" className="w-32 px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.equipes.length === 0 ? (
              <EstadoVazioTabela
                colunas={5}
                titulo="Nenhuma equipe encontrada."
                descricao="Altere ou limpe os filtros para tentar novamente."
              />
            ) : resultado.equipes.map((equipe) => (
              <TableRow key={equipe.id}>
                <TableHead scope="row" className="min-w-44 max-w-sm whitespace-normal wrap-break-word px-4 py-4 font-medium">
                  {equipe.nome}
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
                <TableCell className="px-4">
                  <div className="flex justify-center gap-1">
                    {podeConsultarEstagiarios && (
                      <BotaoEdicao parametro="estagiarios" tom="lista" href={hrefDoModal("estagiarios", equipe.id)} rotulo={`Estagiários de ${equipe.nome}`}>
                        <UsersIcon />
                      </BotaoEdicao>
                    )}
                    <BotaoEdicao parametro="editar" tom="editar" href={hrefDoModal("editar", equipe.id)} rotulo={`Editar ${equipe.nome}`}>
                      <PencilIcon />
                    </BotaoEdicao>
                    {resultado.podeGerenciar && (
                      <BotaoEdicao parametro="ativacao" tom={equipe.ativa ? "inativar" : "ativar"} href={hrefDoModal("ativacao", equipe.id)} rotulo={`${equipe.ativa ? "Inativar" : "Ativar"} ${equipe.nome}`}>
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
        rotuloTotal="equipe(s)"
        ariaLabel="Paginação das equipes"
        href={(pagina) => urlDaPagina(pagina, resultado.busca, resultado.unidadeId, resultado.status)}
      />

      <ModalEdicao parametro="editar" aberto={Boolean(editar)} titulo="Editar equipe" limpar={["editar", "equipeCriada"]}>
        {editar && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando equipe…" />}>
            <DetalheEquipe id={editar} secao="dados" />
          </Suspense>
        )}
      </ModalEdicao>
      <ModalEdicao parametro="ativacao" aberto={Boolean(ativacao)} titulo="Ativar ou inativar equipe" limpar={["ativacao"]}>
        {ativacao && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando equipe…" />}>
            <DetalheEquipe id={ativacao} secao="ativacao" />
          </Suspense>
        )}
      </ModalEdicao>
      <ModalEdicao parametro="estagiarios" aberto={Boolean(estagiarios)} titulo="Estagiários da equipe" limpar={PARAMETROS_DOS_ESTAGIARIOS}>
        {estagiarios && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando estagiários…" />}>
            <EstagiariosEquipe id={estagiarios} parametros={parametros} />
          </Suspense>
        )}
      </ModalEdicao>
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
