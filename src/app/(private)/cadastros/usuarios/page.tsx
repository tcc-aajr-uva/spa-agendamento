import { Suspense } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { CabecalhoListagem } from "@/components/cabecalho-listagem";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUsuarios } from "@/lib/usuario/listar-usuarios";
import { rotuloDoEstadoAcesso, rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { situacaoListagemUsuarioSchema } from "@/lib/usuario/situacao-listagem";
import { perfisDaRota } from "../../menu";
import { FiltrosUsuarios } from "./filtros-usuarios";

type Props = {
  searchParams: Promise<{ busca?: string | string[]; pagina?: string | string[]; status?: string | string[] }>;
};

export default function UsuariosPage({ searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <CabecalhoListagem
        titulo="Usuários"
        descricao="Consulte os usuários que pertencem ao seu escopo de atuação."
        acao={
          <Button size="lg" nativeButton={false} render={<Link href="/cadastros/usuarios/novo" />}>
            Novo usuário
          </Button>
        }
      />

      <Suspense fallback={<p>Carregando usuários…</p>}>
        <ListaUsuarios searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ListaUsuarios({ searchParams }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const parametros = await searchParams;
  const busca = valorUnico(parametros.busca) ?? "";
  const pagina = valorUnico(parametros.pagina) ?? "1";
  const statusInformado = valorUnico(parametros.status);
  const status = situacaoListagemUsuarioSchema.parse(statusInformado);
  const resultado = await listarUsuarios({ busca, pagina, status }, autor);

  return (
    <div className="space-y-6">
      <FiltrosUsuarios buscaInicial={busca} statusInicial={status} />

      <div className="overflow-hidden rounded-lg border">
        <Table aria-label="Usuários" className="min-w-225">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Usuário</TableHead>
              <TableHead scope="col">Perfil</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col">Vínculos</TableHead>
              <TableHead scope="col" className="w-10 px-4" aria-label="Detalhes do usuário" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.usuarios.length === 0 ? (
              <EstadoVazioTabela
                colunas={5}
                titulo="Nenhum usuário encontrado."
                descricao={busca || status !== "TODOS"
                  ? "Altere ou limpe os filtros para tentar novamente."
                  : "Crie o primeiro usuário disponível para o seu perfil."}
              />
            ) : resultado.usuarios.map((usuario) => (
              <TableRow key={usuario.id} className="relative">
                <TableHead scope="row" className="min-w-52 whitespace-normal px-4 py-4">
                  <div className="space-y-1">
                    {usuario.podeGerenciar ? (
                      <Link
                        className="font-medium underline-offset-4 hover:underline after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                        href={`/cadastros/usuarios/${usuario.id}`}
                      >
                        {usuario.nome}
                      </Link>
                    ) : <span className="font-medium">{usuario.nome}</span>}
                    <p className="font-normal text-muted-foreground">{usuario.email}</p>
                  </div>
                </TableHead>
                <TableCell><Badge variant="outline">{rotuloDoPerfil(usuario.perfil)}</Badge></TableCell>
                <TableCell>
                  <Badge variant={usuario.estadoAcesso === "ATIVO" ? "default" : "outline"}>
                    {rotuloDoEstadoAcesso(usuario.estadoAcesso)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                  <div className="space-y-1">
                    <p>Unidades: {usuario.unidades.join(", ") || "nenhuma"}</p>
                    {usuario.equipes.length > 0 && <p>Equipes: {usuario.equipes.join(", ")}</p>}
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {usuario.podeGerenciar && (
                    <ChevronRightIcon aria-hidden="true" className="ml-auto size-4 text-muted-foreground" />
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
        rotuloTotal="usuário(s)"
        ariaLabel="Paginação dos usuários"
        href={(paginaAtual) => urlDaPagina(paginaAtual, busca, status)}
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
  return `/cadastros/usuarios?${parametros}`;
}

