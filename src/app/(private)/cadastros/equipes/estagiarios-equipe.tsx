import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { listarEstagiariosDaEquipe } from "@/lib/equipe/listar-estagiarios-equipe";
import { rotuloDoEstadoAcesso } from "@/lib/usuario/rotulos";
import { criarParametrosBusca, type ParametrosBusca } from "@/lib/url/parametros-busca";
import { primeiro } from "../../parametros";
import { FiltrosEstagiariosEquipe } from "./filtros-estagiarios-equipe";

export async function EstagiariosEquipe({ id, parametros }: { id: string; parametros: ParametrosBusca }) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const resultado = await listarEstagiariosDaEquipe(id, {
    busca: primeiro(parametros.buscaEstagiarios) ?? "",
    pagina: primeiro(parametros.paginaEstagiarios) ?? "1",
  }, autor);
  if (!resultado) return <p className="text-muted-foreground">Equipe não encontrada ou consulta não permitida.</p>;
  const { equipe } = resultado;

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold wrap-break-word">{equipe.nome}</h2>
        <p className="text-sm wrap-break-word text-muted-foreground">Unidade: {equipe.unidade.nome}{!equipe.unidade.ativa && " (inativa)"}</p>
      </div>

      <FiltrosEstagiariosEquipe key={equipe.id} buscaInicial={resultado.busca} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table aria-label="Estagiários da equipe" className="min-w-140">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Nome</TableHead>
              <TableHead scope="col">E-mail</TableHead>
              <TableHead scope="col">Situação de acesso</TableHead>
              <TableHead scope="col" className="w-20 px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.estagiarios.length === 0 ? (
              <EstadoVazioTabela colunas={4} titulo="Nenhum estagiário encontrado." descricao={resultado.busca
                ? "Altere ou limpe a busca para tentar novamente."
                : "Esta equipe não possui estagiários com vínculo vigente."} />
            ) : resultado.estagiarios.map((estagiario) => (
              <TableRow key={estagiario.id}>
                <TableHead scope="row" className="whitespace-normal px-4 py-4 font-medium">{estagiario.nome}</TableHead>
                <TableCell className="whitespace-normal break-all text-muted-foreground">{estagiario.email}</TableCell>
                <TableCell>
                  <Badge variant={estagiario.estadoAcesso === "ATIVO" ? "default" : "outline"}>{rotuloDoEstadoAcesso(estagiario.estadoAcesso)}</Badge>
                </TableCell>
                <TableCell className="px-4 text-center">
                  {estagiario.podeAbrirCadastro && (
                    <Button variant="ghost" size="icon-sm" nativeButton={false}
                      className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      aria-label={`Abrir cadastro de ${estagiario.nome}`} title={`Abrir cadastro de ${estagiario.nome}`}
                      render={<Link href={`/cadastros/usuarios?editar=${estagiario.id}`} prefetch={false} />}>
                      <PencilIcon />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
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
