import { Item, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarOpcoesDeHorario, type OpcaoDeHorario } from "@/lib/agendamento/opcoes-de-horario";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarEquipesParaDesignar } from "@/lib/lista-espera/designar-paciente";
import { PERFIS_QUE_DESIGNAM } from "@/lib/lista-espera/inscricao";
import { listarListaEspera } from "@/lib/lista-espera/listar-lista-espera";
import { CarregandoLista } from "../carregando-lista";
import { EstadoVazio } from "../cartao";
import { formatarData } from "../formatar";
import { FormularioAcao } from "../formulario-acao";
import { ModalFormulario } from "../modal-formulario";
import { PaginaModulo } from "../pagina-modulo";
import { Paginacao } from "../paginacao";
import { montarHref, numeroDaPagina, primeiro, TAMANHO_DA_PAGINA } from "../parametros";
import { perfisDaRota } from "../menu";
import { designar, remover } from "./actions";
import { PainelAgendar } from "./[id]/chamar/conteudo-chamar";
import { FormularioDesignacao } from "./formulario-designacao";
import { SeletorDeEquipe } from "./seletor-de-equipe";

type Busca = PageProps<"/lista-espera">["searchParams"];

type Inscricao = {
  id: string;
  posicao: number;
  inscritoEm: Date;
  estagiario: { nome: string };
  paciente: { nome: string; telefone: string; email: string; dataNascimento: Date; responsavelNome: string | null };
};

type Agendamento = { equipe: string; opcoes: OpcaoDeHorario[] } | null;

type Visao = { agendamento: Agendamento; veEstagiario: boolean };

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
  const ehEstagiario = usuario.perfil === "ESTAGIARIO";
  const [{ equipes, equipe, inscricoes, total }, equipesParaDesignar] = await Promise.all([
    listarListaEspera(usuario, { equipeId: primeiro(parametros.equipe), pagina, tamanho: TAMANHO_DA_PAGINA }),
    PERFIS_QUE_DESIGNAM.includes(usuario.perfil) ? listarEquipesParaDesignar(usuario) : Promise.resolve([]),
  ]);

  const cadastrar = equipesParaDesignar.length > 0 && (
    <ModalFormulario rotulo="Cadastrar paciente" titulo="Cadastrar e designar paciente" atualizarAoFechar>
      <FormularioDesignacao acao={designar} equipes={equipesParaDesignar} />
    </ModalFormulario>
  );

  if (!equipe) {
    return (
      <div className="flex flex-col gap-4">
        {cadastrar}
        <EstadoVazio>Nenhuma equipe disponível.</EstadoVazio>
      </div>
    );
  }

  const visao: Visao = {
    veEstagiario: !ehEstagiario,
    agendamento:
      ehEstagiario && inscricoes.length > 0
        ? { equipe: `${equipe.unidade.nome} / ${equipe.nome}`, opcoes: await listarOpcoesDeHorario({ unidadeId: equipe.unidadeId, estagiarioId: usuario.id }) }
        : null,
  };
  const opcoes = equipes.map((opcao) => ({ value: opcao.id, label: `${opcao.unidade.nome} / ${opcao.nome}` }));

  return (
    <div className="flex flex-col gap-4">
      {cadastrar && <div className="flex justify-end">{cadastrar}</div>}
      <SeletorDeEquipe equipes={opcoes} atual={equipe.id}>
        <h2 className="text-lg font-semibold">
          {equipe.unidade.nome} / {equipe.nome} — {total} aguardando{ehEstagiario ? " com você" : ""}
        </h2>
        {inscricoes.length === 0 ? (
          <EstadoVazio>{ehEstagiario ? "Nenhum paciente designado para você nesta equipe." : "Lista de espera vazia."}</EstadoVazio>
        ) : (
          <>
            <TabelaDeInscricoes inscricoes={inscricoes} visao={visao} />
            <ItensDeInscricao inscricoes={inscricoes} visao={visao} />
          </>
        )}
        <Paginacao pagina={pagina} total={total} tamanho={TAMANHO_DA_PAGINA} href={(novaPagina) => montarHref("/lista-espera", { equipe: equipe.id, pagina: novaPagina })} />
      </SeletorDeEquipe>
    </div>
  );
}

function Acoes({ inscricao, agendamento, larguraTotal }: { inscricao: Inscricao; agendamento: Agendamento; larguraTotal?: boolean }) {
  const primeiroDaLista = inscricao.posicao === 1;
  return (
    <div className={larguraTotal ? "grid w-full grid-cols-2 gap-2" : "flex items-center justify-center gap-2"}>
      {agendamento && (
        <ModalFormulario rotulo="Agendar" titulo="Agendar paciente da lista" variante={primeiroDaLista ? "default" : "outline"} tamanho="sm" atualizarAoFechar>
          <PainelAgendar
            inscricaoId={inscricao.id}
            inscritoEm={inscricao.inscritoEm}
            equipe={agendamento.equipe}
            paciente={inscricao.paciente}
            opcoes={agendamento.opcoes}
          />
        </ModalFormulario>
      )}
      <FormularioAcao
        acao={remover.bind(null, inscricao.id)}
        rotulo="Remover"
        confirmacao="Remover este paciente da lista de espera? Use quando ele não for localizado ou desistir."
        variante="ghost"
        tamanho="sm"
        larguraTotal={larguraTotal}
      />
    </div>
  );
}

function TabelaDeInscricoes({ inscricoes, visao }: { inscricoes: Inscricao[]; visao: Visao }) {
  return (
    <div className="hidden overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 pl-4">Posição</TableHead>
            <TableHead>Paciente</TableHead>
            {visao.veEstagiario && <TableHead>Estagiário</TableHead>}
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
              {visao.veEstagiario && <TableCell>{inscricao.estagiario.nome}</TableCell>}
              <TableCell className="text-muted-foreground">{formatarData(inscricao.inscritoEm)}</TableCell>
              <TableCell>
                <Acoes inscricao={inscricao} agendamento={visao.agendamento} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ItensDeInscricao({ inscricoes, visao }: { inscricoes: Inscricao[]; visao: Visao }) {
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
            {visao.veEstagiario && <ItemDescription>{inscricao.estagiario.nome}</ItemDescription>}
          </ItemContent>
          <ItemFooter>
            <Acoes inscricao={inscricao} agendamento={visao.agendamento} larguraTotal />
          </ItemFooter>
        </Item>
      ))}
    </ItemGroup>
  );
}
