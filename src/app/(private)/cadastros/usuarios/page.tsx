import { Suspense } from "react";
import { KeyRoundIcon, PencilIcon, PowerIcon } from "lucide-react";

import { CabecalhoListagem } from "@/components/cabecalho-listagem";
import { EstadoVazioTabela } from "@/components/estado-vazio-tabela";
import { PaginacaoLista } from "@/components/paginacao-lista";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUsuarios } from "@/lib/usuario/listar-usuarios";
import { rotuloDasUnidades, rotuloDoEstadoAcesso, rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { situacaoListagemUsuarioSchema } from "@/lib/usuario/situacao-listagem";
import { perfisDaRota } from "../../menu";
import { FiltrosUsuarios } from "./filtros-usuarios";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { ModalFormulario } from "../../modal-formulario";
import { ConteudoNovoUsuario } from "./novo/conteudo-novo-usuario";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { BotaoEdicao, ModalEdicao } from "../../modal-edicao";
import { hrefDeEdicao } from "../../parametros";
import { DetalheUsuario } from "./[id]/detalhe-usuario";

type Props = {
  searchParams: Promise<ParametrosBusca>;
};

const PARAMETROS_DOS_MODAIS = ["editar", "ativacao", "acesso"];

const MODAIS = [
  { parametro: "editar", titulo: "Editar usuário", secao: "dados", limpar: ["editar"] },
  { parametro: "ativacao", titulo: "Situação do usuário", secao: "ativacao", limpar: ["ativacao"] },
  { parametro: "acesso", titulo: "Acesso ao sistema", secao: "acesso", limpar: ["acesso"] },
] as const;

export default function UsuariosPage({ searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <CabecalhoListagem
        titulo="Usuários"
        descricao="Consulte os usuários que pertencem ao seu escopo de atuação."
        acao={
          <ModalFormulario rotulo="Novo usuário" titulo="Novo usuário">
            <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
              <ConteudoNovoUsuario />
            </Suspense>
          </ModalFormulario>
        }
      />

      <Suspense fallback={<IndicadorCarregando texto="Carregando usuários…" />}>
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
  const hrefDoModal = (chave: string, id: string) => hrefDeEdicao("/cadastros/usuarios", parametros, chave, id, PARAMETROS_DOS_MODAIS);

  return (
    <div className="space-y-6">
      <FiltrosUsuarios buscaInicial={busca} statusInicial={status} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table aria-label="Usuários" className="min-w-225">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="px-4">Usuário</TableHead>
              <TableHead scope="col">Perfil</TableHead>
              <TableHead scope="col">Situação</TableHead>
              <TableHead scope="col">Vínculos</TableHead>
              <TableHead scope="col" className="w-40 px-4">Ações</TableHead>
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
              <TableRow key={usuario.id}>
                <TableHead scope="row" className="min-w-52 whitespace-normal px-4 py-4">
                  <div className="space-y-1">
                    <span className="font-medium">{usuario.nome}</span>
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
                    <p>Unidades: {rotuloDasUnidades(usuario.perfil, usuario.unidades)}</p>
                    {usuario.equipes.length > 0 && <p>Equipes: {usuario.equipes.join(", ")}</p>}
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {usuario.podeGerenciar && (
                    <div className="flex justify-center gap-1">
                      <BotaoEdicao parametro="editar" tom="editar" href={hrefDoModal("editar", usuario.id)} rotulo={`Editar ${usuario.nome}`}>
                        <PencilIcon />
                      </BotaoEdicao>
                      <BotaoEdicao parametro="ativacao" tom={usuario.ativo ? "inativar" : "ativar"} href={hrefDoModal("ativacao", usuario.id)} rotulo={`Situação de ${usuario.nome}`}>
                        <PowerIcon />
                      </BotaoEdicao>
                      <BotaoEdicao parametro="acesso" tom="acesso" href={hrefDoModal("acesso", usuario.id)} rotulo={`Acesso ao sistema de ${usuario.nome}`}>
                        <KeyRoundIcon />
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
        rotuloTotal="usuário(s)"
        ariaLabel="Paginação dos usuários"
        href={(paginaAtual) => urlDaPagina(paginaAtual, busca, status)}
      />

      {MODAIS.map((modal) => {
        const id = valorUnico(parametros[modal.parametro]);
        return (
          <ModalEdicao key={modal.parametro} parametro={modal.parametro} aberto={Boolean(id)} titulo={modal.titulo} limpar={[...modal.limpar]}>
            {id && (
              <Suspense fallback={<IndicadorCarregando texto="Carregando usuário…" />}>
                <DetalheUsuario id={id} secao={modal.secao} />
              </Suspense>
            )}
          </ModalEdicao>
        );
      })}
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

