import Link from "next/link";
import { CalendarClockIcon, PencilIcon } from "lucide-react";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { listarAtendimentoVigenteDaEquipe } from "@/lib/equipe/atendimento-equipe";
import { dataDoPeriodo, formatarDataPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import { criarParametrosBusca, type ParametrosBusca } from "@/lib/url/parametros-busca";
import { primeiro } from "../../parametros";
import { LinkEdicao } from "../../modal-edicao";
import { FiltrosEstagiariosEquipe } from "./filtros-estagiarios-equipe";
import { podeConfigurarAtendimento } from "@/lib/usuario/atendimento-estagiario";

export async function EstagiariosEquipe({ id, parametros }: { id: string; parametros: ParametrosBusca }) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const resultado = await listarAtendimentoVigenteDaEquipe(id, {
    busca: primeiro(parametros.buscaEstagiarios) ?? "",
    pagina: primeiro(parametros.paginaEstagiarios) ?? "1",
  }, autor);
  if (!resultado) return <p className="text-muted-foreground">Equipe não encontrada ou consulta não permitida.</p>;
  const { equipe } = resultado;
  const configuraAtendimento = podeConfigurarAtendimento(autor);

  function hrefAtendimento(estagiarioId: string) {
    const busca = criarParametrosBusca(parametros);
    busca.delete("estagiarios");
    busca.set("editar", equipe.id);
    busca.set("abaEquipe", "estagiarios");
    busca.set("atendimentoEstagiario", estagiarioId);
    busca.delete("atendimentoPeriodoEstagiario");
    return `/cadastros/equipes?${busca}`;
  }

  return (
    <div className="min-w-0 space-y-6">
      <FiltrosEstagiariosEquipe key={equipe.id} buscaInicial={resultado.busca} />

      <p className="text-sm text-muted-foreground">
        {resultado.periodo
          ? `Período vigente: ${formatarDataPeriodo(dataDoPeriodo(resultado.periodo.inicio))} a ${formatarDataPeriodo(dataDoPeriodo(resultado.periodo.fim))}`
          : "Sem período letivo vigente."}
      </p>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table aria-label="Estagiários da equipe" className="min-w-160">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Nome</TableHead>
              <TableHead scope="col">E-mail</TableHead>
              <TableHead scope="col">Atendimento</TableHead>
              <TableHead scope="col" className="whitespace-normal">Limite de pacientes</TableHead>
              <TableHead scope="col" className="w-24 px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.estagiarios.length === 0 ? (
              <EstadoVazioTabela colunas={5} titulo="Nenhum estagiário encontrado." descricao={resultado.busca
                ? "Altere ou limpe a busca para tentar novamente."
                : "Esta equipe não possui estagiários com vínculo vigente."} />
            ) : resultado.estagiarios.map((estagiario) => {
              const configuracao = estagiario.configuracao;
              const situacaoAtendimento = !estagiario.disponivel ? "Indisponível" : !resultado.periodo ? null
                : !configuracao ? "Não configurado" : configuracao.liberado && configuracao.limitePacientes > 0 ? "Liberado" : "Bloqueado";
              return (
                <TableRow key={estagiario.id}>
                  <TableHead scope="row" className="whitespace-normal px-4 py-4 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{estagiario.nome}</span>
                      {!estagiario.ativo && <Badge variant="outline">Conta inativa</Badge>}
                    </div>
                  </TableHead>
                  <TableCell className="whitespace-normal break-all text-muted-foreground">{estagiario.email}</TableCell>
                  <TableCell>
                    {situacaoAtendimento ? <Badge variant={situacaoAtendimento === "Liberado" ? "default" : "outline"}>{situacaoAtendimento}</Badge>
                      : <span title="Sem período letivo vigente">—</span>}
                  </TableCell>
                  <TableCell>{configuracao?.limitePacientes ?? "—"}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex justify-center gap-1">
                      {configuraAtendimento && (estagiario.disponivel ? (
                        <Button variant="ghost" size="icon-sm" nativeButton={false}
                          className="bg-secondary/35 text-secondary-foreground hover:bg-secondary/60 hover:text-secondary-foreground"
                          aria-label={`Atendimento de ${estagiario.nome}`} title={`Atendimento de ${estagiario.nome}`}
                          render={<LinkEdicao parametro="atendimentoEstagiario" href={hrefAtendimento(estagiario.id)} prefetch={false} />}>
                          <CalendarClockIcon />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon-sm" disabled aria-label={`Atendimento de ${estagiario.nome}`}
                          title={!estagiario.ativo ? "Conta inativa" : "Equipe ou unidade inativa"}>
                          <CalendarClockIcon />
                        </Button>
                      ))}
                      {estagiario.podeAbrirCadastro && (
                        <Button variant="ghost" size="icon-sm" nativeButton={false}
                          className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                          aria-label={`Abrir cadastro de ${estagiario.nome}`} title={`Abrir cadastro de ${estagiario.nome}`}
                          render={<Link href={`/cadastros/usuarios?editar=${estagiario.id}`} prefetch={false} />}>
                          <PencilIcon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PaginacaoLista pagina={resultado.pagina} totalPaginas={resultado.totalPaginas} total={resultado.total}
        rotuloTotal="estagiário(s)" ariaLabel="Paginação dos estagiários da equipe" href={(pagina) => {
          const busca = criarParametrosBusca(parametros);
          busca.set("paginaEstagiarios", String(pagina));
          return `/cadastros/equipes?${busca}`;
        }} />

    </div>
  );
}
