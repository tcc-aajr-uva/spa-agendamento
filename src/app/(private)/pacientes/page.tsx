import { Suspense } from "react";
import Form from "next/form";
import { ClipboardListIcon } from "lucide-react";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StatusAgendamento } from "@/generated/prisma/client";
import { filtroDosAtendimentos } from "@/lib/atendimento/acesso";
import { statusDoAgendamento } from "@/lib/atendimento/rotulos";
import { exigirUsuario, filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { DIAS_DA_SEMANA, filtroAgendamentoAtivo, formatarHora, pendenteVencendo } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { BotaoFiltrar } from "../botao-filtrar";
import { CampoSelect } from "../campo-select";
import { CarregandoLista } from "../carregando-lista";
import { EstadoVazio } from "../cartao";
import { formatarDataHora } from "../formatar";
import { BotaoEdicao, ModalEdicao } from "../modal-edicao";
import { PaginaModulo } from "../pagina-modulo";
import { Paginacao } from "../paginacao";
import { hrefDeEdicao, montarHref, numeroDaPagina, primeiro, TAMANHO_DA_PAGINA } from "../parametros";
import { perfisDaRota } from "../menu";
import { DetalhePaciente } from "./[id]/detalhe-paciente";
import { EncerrarPeriodo } from "./encerrar-periodo";

type Busca = PageProps<"/pacientes">["searchParams"];

type LinhaDePaciente = {
  id: string;
  nome: string;
  telefone: string;
  horario: string;
  sala: string;
  estagiario: string;
  status: StatusAgendamento;
  prazo: string;
  vencendo: boolean;
};

export default function PacientesPage({ searchParams }: PageProps<"/pacientes">) {
  return (
    <PaginaModulo titulo="Pacientes" carregando={<CarregandoLista />}>
      <Pacientes busca={searchParams} />
    </PaginaModulo>
  );
}

async function Pacientes({ busca }: { busca: Busca }) {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  const parametros = await busca;
  const pagina = numeroDaPagina(primeiro(parametros.pagina));
  const equipeId = primeiro(parametros.equipe) || undefined;
  const estagiarioId = primeiro(parametros.estagiario) || undefined;
  const agora = new Date();

  const where = { ...filtroDosAtendimentos(usuario, { equipeId, estagiarioId }), ...filtroAgendamentoAtivo(agora) };
  const [agendamentos, total] = await Promise.all([
    prisma.agendamento.findMany({
      where,
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * TAMANHO_DA_PAGINA,
      take: TAMANHO_DA_PAGINA,
      select: {
        id: true,
        diaSemana: true,
        horaInicio: true,
        status: true,
        prazoConfirmacao: true,
        paciente: { select: { nome: true, telefone: true } },
        estagiario: { select: { nome: true } },
        sala: { select: { nome: true } },
      },
    }),
    prisma.agendamento.count({ where }),
  ]);

  const veEquipe = usuario.perfil !== "ESTAGIARIO";
  const href = (novaPagina: number) => montarHref("/pacientes", { equipe: equipeId, estagiario: estagiarioId, pagina: novaPagina });
  const atendimento = primeiro(parametros.atendimento);
  const hrefDoAtendimento = (id: string) => hrefDeEdicao("/pacientes", parametros, "atendimento", id);
  const linhas: LinhaDePaciente[] = agendamentos.map((agendamento) => {
    const pendente = agendamento.status === "PENDENTE";
    return {
      id: agendamento.id,
      nome: agendamento.paciente.nome,
      telefone: agendamento.paciente.telefone,
      horario: `${DIAS_DA_SEMANA[agendamento.diaSemana]}, ${formatarHora(agendamento.horaInicio)}`,
      sala: agendamento.sala.nome,
      estagiario: agendamento.estagiario.nome,
      status: agendamento.status,
      prazo: pendente ? `confirmar até ${formatarDataHora(agendamento.prazoConfirmacao)}` : "",
      vencendo: pendente && pendenteVencendo(agendamento, agora),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <EncerrarPeriodo usuario={usuario} />
      {veEquipe && <Filtros usuario={usuario} equipeId={equipeId} estagiarioId={estagiarioId} />}
      {linhas.length === 0 ? (
        <EstadoVazio>Nenhum paciente ativo.</EstadoVazio>
      ) : (
        <>
          <TabelaDePacientes linhas={linhas} veEquipe={veEquipe} hrefDoAtendimento={hrefDoAtendimento} />
          <ListaDePacientes linhas={linhas} veEquipe={veEquipe} hrefDoAtendimento={hrefDoAtendimento} />
        </>
      )}
      <Paginacao pagina={pagina} total={total} tamanho={TAMANHO_DA_PAGINA} href={href} />
      <ModalEdicao parametro="atendimento" aberto={Boolean(atendimento)} titulo="Atendimento" limpar={["atendimento"]} largura="sm:max-w-6xl">
        {atendimento && (
          <Suspense fallback={<IndicadorCarregando texto="Carregando atendimento…" />}>
            <DetalhePaciente id={atendimento} />
          </Suspense>
        )}
      </ModalEdicao>
    </div>
  );
}

function StatusDoPaciente({ status }: { status: StatusAgendamento }) {
  const { rotulo, variante } = statusDoAgendamento(status);
  return <Badge variant={variante}>{rotulo}</Badge>;
}

type PropsLista = { linhas: LinhaDePaciente[]; veEquipe: boolean; hrefDoAtendimento: (id: string) => string };

function BotaoAtendimento({ linha, hrefDoAtendimento }: { linha: LinhaDePaciente; hrefDoAtendimento: (id: string) => string }) {
  return (
    <BotaoEdicao parametro="atendimento" tom="editar" href={hrefDoAtendimento(linha.id)} rotulo={`Abrir atendimento de ${linha.nome}`}>
      <ClipboardListIcon />
    </BotaoEdicao>
  );
}

function TabelaDePacientes({ linhas, veEquipe, hrefDoAtendimento }: PropsLista) {
  return (
    <div className="hidden overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Paciente</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Sala</TableHead>
            {veEquipe && <TableHead>Estagiário</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="w-20">Atendimento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha) => (
            <TableRow key={linha.id}>
              <TableCell className="pl-4">
                <p className="font-medium">{linha.nome}</p>
                <p className="text-muted-foreground">{linha.telefone}</p>
              </TableCell>
              <TableCell>{linha.horario}</TableCell>
              <TableCell>{linha.sala}</TableCell>
              {veEquipe && <TableCell>{linha.estagiario}</TableCell>}
              <TableCell>
                <StatusDoPaciente status={linha.status} />
              </TableCell>
              <TableCell className={linha.vencendo ? "font-medium text-destructive" : "text-muted-foreground"}>{linha.prazo || "—"}</TableCell>
              <TableCell>
                <BotaoAtendimento linha={linha} hrefDoAtendimento={hrefDoAtendimento} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ListaDePacientes({ linhas, veEquipe, hrefDoAtendimento }: PropsLista) {
  return (
    <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 md:hidden">
      {linhas.map((linha) => (
        <Item key={linha.id} className="rounded-none">
          <ItemContent>
            <ItemTitle>{linha.nome}</ItemTitle>
            <ItemDescription>
              {linha.horario} · {linha.sala}
            </ItemDescription>
            <ItemDescription>{veEquipe ? `${linha.estagiario} · ${linha.telefone}` : linha.telefone}</ItemDescription>
            {linha.prazo && <p className={linha.vencendo ? "font-medium text-destructive" : "text-muted-foreground"}>{linha.prazo}</p>}
          </ItemContent>
          <ItemActions className="self-start">
            <StatusDoPaciente status={linha.status} />
            <BotaoAtendimento linha={linha} hrefDoAtendimento={hrefDoAtendimento} />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

async function Filtros({ usuario, equipeId, estagiarioId }: { usuario: ContextoAutorizacao; equipeId?: string; estagiarioId?: string }) {
  const escopo = filtroDeUnidades(usuario);
  const [equipes, estagiarios] = await Promise.all([
    prisma.equipe.findMany({
      where: { ...escopo, ativa: true },
      orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
      select: { id: true, nome: true, unidade: { select: { nome: true } } },
    }),
    prisma.usuario.findMany({
      where: { perfil: "ESTAGIARIO", ativo: true, equipes: { some: { ...escopo, ...(equipeId ? { equipeId } : {}), ativo: true } } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);
  const opcoesDeEquipe = [{ value: null, label: "Todas" }, ...equipes.map((equipe) => ({ value: equipe.id, label: `${equipe.unidade.nome} / ${equipe.nome}` }))];
  const opcoesDeEstagiario = [{ value: null, label: "Todos" }, ...estagiarios.map((estagiario) => ({ value: estagiario.id, label: estagiario.nome }))];

  return (
    <Form action="/pacientes" scroll={false} className="flex flex-col gap-3 md:flex-row md:items-end">
      <CampoSelect id="filtro-equipe" nome="equipe" rotulo="Equipe" valor={equipeId} opcoes={opcoesDeEquipe} className="md:w-72" />
      <CampoSelect id="filtro-estagiario" nome="estagiario" rotulo="Estagiário" valor={estagiarioId} opcoes={opcoesDeEstagiario} className="md:w-64" />
      <BotaoFiltrar />
    </Form>
  );
}
