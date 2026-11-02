import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_QUE_CHAMAM } from "@/lib/lista-espera/inscricao";
import { listarListaEspera } from "@/lib/lista-espera/listar-lista-espera";
import { CarregandoLista } from "../carregando-lista";
import { EstadoVazio } from "../cartao";
import { formatarData } from "../formatar";
import { FormularioAcao } from "../formulario-acao";
import { PaginaModulo } from "../pagina-modulo";
import { Paginacao } from "../paginacao";
import { montarHref, numeroDaPagina, primeiro, TAMANHO_DA_PAGINA } from "../parametros";
import { perfisDaRota } from "../menu";
import { remover } from "./actions";
import { SeletorDeEquipe } from "./seletor-de-equipe";

type Busca = PageProps<"/lista-espera">["searchParams"];

type Inscricao = {
  id: string;
  posicao: number;
  inscritoEm: Date;
  paciente: { nome: string; telefone: string };
};

export default function ListaEsperaPage({ searchParams }: PageProps<"/lista-espera">) {
  return (
    <PaginaModulo titulo="Lista de espera" carregando={<CarregandoLista />}>
      <Lista busca={searchParams} />
    </PaginaModulo>
  );
}

async function Lista({ busca }: { busca: Busca }) {
  const usuario = await exigirUsuario(perfisDaRota("/lista-espera"));
  const parametros = await busca;
  const pagina = numeroDaPagina(primeiro(parametros.pagina));
  const { equipes, equipe, inscricoes, total } = await listarListaEspera(usuario, {
    equipeId: primeiro(parametros.equipe),
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
  });

  if (!equipe) return <EstadoVazio>Nenhuma equipe disponível.</EstadoVazio>;
  const podeChamar = PERFIS_QUE_CHAMAM.includes(usuario.perfil);
  const opcoes = equipes.map((opcao) => ({ value: opcao.id, label: `${opcao.unidade.nome} / ${opcao.nome}` }));

  return (
    <div className="flex flex-col gap-4">
      <SeletorDeEquipe equipes={opcoes} atual={equipe.id}>
        <h2 className="text-lg font-semibold">
          {equipe.unidade.nome} / {equipe.nome} — {total} aguardando
        </h2>
        {inscricoes.length === 0 ? (
          <EstadoVazio>Lista de espera vazia.</EstadoVazio>
        ) : (
          <>
            <TabelaDeInscricoes inscricoes={inscricoes} podeChamar={podeChamar} />
            <ItensDeInscricao inscricoes={inscricoes} podeChamar={podeChamar} />
          </>
        )}
        <Paginacao pagina={pagina} total={total} tamanho={TAMANHO_DA_PAGINA} href={(novaPagina) => montarHref("/lista-espera", { equipe: equipe.id, pagina: novaPagina })} />
      </SeletorDeEquipe>
    </div>
  );
}

function Acoes({ inscricao, podeChamar, larguraTotal }: { inscricao: Inscricao; podeChamar: boolean; larguraTotal?: boolean }) {
  const primeiroDaLista = inscricao.posicao === 1;
  return (
    <div className={larguraTotal ? "grid w-full grid-cols-2 gap-2" : "flex items-center justify-end gap-2"}>
      {podeChamar && (
        <Button variant={primeiroDaLista ? "default" : "outline"} size="sm" nativeButton={false} render={<Link href={`/lista-espera/${inscricao.id}/chamar`} />}>
          {primeiroDaLista ? "Chamar o 1º da lista" : "Chamar"}
        </Button>
      )}
      <FormularioAcao
        acao={remover.bind(null, inscricao.id)}
        rotulo="Remover"
        confirmacao="Remover este paciente da lista de espera?"
        variante="ghost"
        tamanho="sm"
        larguraTotal={larguraTotal}
      />
    </div>
  );
}

function TabelaDeInscricoes({ inscricoes, podeChamar }: { inscricoes: Inscricao[]; podeChamar: boolean }) {
  return (
    <div className="hidden overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 pl-4">Posição</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Na lista desde</TableHead>
            <TableHead aria-label="Ações" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inscricoes.map((inscricao) => (
            <TableRow key={inscricao.id} className={inscricao.posicao === 1 ? "bg-accent hover:bg-accent" : undefined}>
              <TableCell className="pl-4 font-semibold">{inscricao.posicao}º</TableCell>
              <TableCell>
                <p className="font-medium">{inscricao.paciente.nome}</p>
                <p className="text-muted-foreground">{inscricao.paciente.telefone}</p>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatarData(inscricao.inscritoEm)}</TableCell>
              <TableCell>
                <Acoes inscricao={inscricao} podeChamar={podeChamar} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ItensDeInscricao({ inscricoes, podeChamar }: { inscricoes: Inscricao[]; podeChamar: boolean }) {
  return (
    <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 md:hidden">
      {inscricoes.map((inscricao) => (
        <Item key={inscricao.id} className={inscricao.posicao === 1 ? "rounded-none bg-accent" : "rounded-none"}>
          <ItemContent>
            <ItemTitle>
              {inscricao.posicao}º — {inscricao.paciente.nome}
            </ItemTitle>
            <ItemDescription>
              {inscricao.paciente.telefone} · desde {formatarData(inscricao.inscritoEm)}
            </ItemDescription>
          </ItemContent>
          <ItemFooter>
            <Acoes inscricao={inscricao} podeChamar={podeChamar} larguraTotal />
          </ItemFooter>
        </Item>
      ))}
    </ItemGroup>
  );
}
