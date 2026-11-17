import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarClock, ChevronRight, Clock, Info, Users } from "lucide-react";
import { FaChildren } from "react-icons/fa6";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { listarHorariosLivres, type HorarioLivre } from "@/lib/agendamento/horarios-livres";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { agendar, entrarNaLista } from "./actions";
import { linkDaEtapa, type Selecao } from "./etapas";
import { FormularioPaciente } from "./formulario-paciente";
import { IndicadorEtapas } from "./indicador-etapas";

type Busca = PageProps<"/agendar">["searchParams"];

const TRANSICAO = "transition-colors duration-200 ease-out";

const CARTAO_AZUL =
  "relative overflow-hidden border border-primary/30 bg-card bg-linear-to-br from-primary/20 via-primary/5 to-card shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-linear-to-r before:from-primary before:to-primary/40";

export default function AgendarPage({ searchParams }: PageProps<"/agendar">) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Agendar atendimento</h1>
      <Suspense fallback={<Carregando />}>
        <Etapa busca={searchParams} />
      </Suspense>
    </main>
  );
}

function Carregando() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

async function Etapa({ busca }: { busca: Busca }) {
  const parametros = await busca;
  const [unidade, equipe, dia, hora] = ["unidade", "equipe", "dia", "hora"].map((chave) => primeiro(parametros[chave]));
  const selecao = { unidade, equipe };

  if (!unidade) {
    return (
      <Passo atual={0} selecao={selecao} titulo="Escolha a unidade">
        <EscolherUnidade />
      </Passo>
    );
  }
  if (!equipe) {
    return (
      <Passo atual={1} selecao={selecao} titulo="Escolha o tipo de atendimento">
        <EscolherEquipe unidadeId={unidade} />
      </Passo>
    );
  }
  if (dia === undefined || hora === undefined) {
    return (
      <Passo atual={2} selecao={selecao} titulo="Escolha o dia e o horário">
        <EscolherHorario unidadeId={unidade} equipeId={equipe} />
      </Passo>
    );
  }

  return (
    <Passo atual={3} selecao={selecao} titulo="Preencha seus dados">
      <Item variant="outline" className={`pt-4 ${CARTAO_AZUL}`}>
        <ItemMedia variant="icon" className="bg-primary/15 text-primary">
          <CalendarClock />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {DIAS_DA_SEMANA[Number(dia)]} às {formatarHora(Number(hora))}, toda semana
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={linkDaEtapa(2, selecao)} />}>
            Trocar
          </Button>
        </ItemActions>
      </Item>
      <FormularioPaciente
        acao={agendar}
        rotuloBotao="Agendar"
        camposOcultos={{ unidadeId: unidade, equipeId: equipe, diaSemana: dia, horaInicio: hora }}
      />
    </Passo>
  );
}

type PassoProps = { atual: number; selecao: Selecao; titulo: string; children: ReactNode };

function Passo({ atual, selecao, titulo, children }: PassoProps) {
  const voltar = atual === 0 ? "/" : linkDaEtapa(atual - 1, selecao);
  return (
    <>
      <IndicadorEtapas atual={atual} selecao={selecao} />
      <section className="flex flex-col gap-4">
        <div className="flex flex-col items-start gap-1">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" nativeButton={false} render={<Link href={voltar} />}>
            <ArrowLeft />
            Voltar
          </Button>
          <h2 className="text-lg font-semibold">{titulo}</h2>
        </div>
        {children}
      </section>
    </>
  );
}

function CartaoOpcao({ href, icone, titulo, extra }: { href: string; icone: ReactNode; titulo: string; extra?: ReactNode }) {
  return (
    <Item
      variant="outline"
      className={`p-4 pt-5 [a]:hover:border-primary/60 [a]:hover:from-primary/30 ${CARTAO_AZUL} ${TRANSICAO}`}
      render={<Link href={href} />}
    >
      <ItemMedia
        className={`size-10 rounded-lg bg-primary/15 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground ${TRANSICAO} [&_svg]:size-5`}
      >
        {icone}
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-base">{titulo}</ItemTitle>
        {extra}
      </ItemContent>
      <ChevronRight
        aria-hidden
        className="size-5 text-muted-foreground transition-transform duration-200 ease-out group-hover/item:translate-x-0.5"
      />
    </Item>
  );
}

function SemOpcoes({ mensagem }: { mensagem: string }) {
  return (
    <Alert>
      <Info />
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  );
}

async function EscolherUnidade() {
  const unidades = await prisma.unidade.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, agendamentoAberto: true },
  });
  if (unidades.length === 0) return <SemOpcoes mensagem="Nenhuma unidade disponível no momento." />;
  return (
    <ItemGroup className="gap-3">
      {unidades.map((unidade) => (
        <CartaoOpcao
          key={unidade.id}
          href={linkDaEtapa(1, { unidade: unidade.id })}
          icone={<Building2 />}
          titulo={unidade.nome}
          extra={!unidade.agendamentoAberto && <Badge variant="outline">Agendamento online fechado</Badge>}
        />
      ))}
    </ItemGroup>
  );
}

function iconeDaEquipe(nome: string): ReactNode {
  return nome.toLowerCase().includes("infantil") ? <FaChildren /> : <Users />;
}

async function EscolherEquipe({ unidadeId }: { unidadeId: string }) {
  const equipes = await prisma.equipe.findMany({
    where: { unidadeId, ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
  if (equipes.length === 0) return <SemOpcoes mensagem="Esta unidade não tem atendimentos disponíveis no momento." />;
  return (
    <ItemGroup className="gap-3">
      {equipes.map((equipe) => (
        <CartaoOpcao
          key={equipe.id}
          href={linkDaEtapa(2, { unidade: unidadeId, equipe: equipe.id })}
          icone={iconeDaEquipe(equipe.nome)}
          titulo={equipe.nome}
        />
      ))}
    </ItemGroup>
  );
}

function agruparPorDia(horarios: HorarioLivre[]): [number, number[]][] {
  const porDia = new Map<number, number[]>();
  for (const { diaSemana, horaInicio } of horarios) {
    porDia.set(diaSemana, [...(porDia.get(diaSemana) ?? []), horaInicio]);
  }
  return [...porDia.entries()].sort(([a], [b]) => a - b).map(([dia, horas]) => [dia, horas.sort((a, b) => a - b)]);
}

async function EscolherHorario({ unidadeId, equipeId }: { unidadeId: string; equipeId: string }) {
  const horarios = await listarHorariosLivres(unidadeId, equipeId);

  if (horarios.length === 0) {
    return (
      <>
        <Alert variant="warning">
          <Info />
          <AlertTitle>Não há horário livre agora</AlertTitle>
          <AlertDescription>Preencha a inscrição para entrar na lista de espera. Você será chamado por ordem de inscrição.</AlertDescription>
        </Alert>
        <FormularioPaciente acao={entrarNaLista} rotuloBotao="Entrar na lista de espera" camposOcultos={{ unidadeId, equipeId }} />
      </>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">O atendimento é semanal, no mesmo dia e horário, até o fim do período letivo.</p>
      <div className="flex flex-col gap-3">
        {agruparPorDia(horarios).map(([dia, horas]) => (
          <div key={dia} className={`flex flex-col gap-3 rounded-xl p-4 pt-5 text-card-foreground ${CARTAO_AZUL}`}>
            <h3 className="font-semibold text-primary">{DIAS_DA_SEMANA[dia]}</h3>
            <div className="flex flex-wrap gap-2">
              {horas.map((hora) => (
                <Button
                  key={hora}
                  variant="outline"
                  size="lg"
                  className={`hover:border-primary hover:bg-accent hover:text-accent-foreground ${TRANSICAO}`}
                  nativeButton={false}
                  render={<Link href={`/agendar?${new URLSearchParams({ unidade: unidadeId, equipe: equipeId, dia: String(dia), hora: String(hora) })}`} />}
                >
                  <Clock />
                  {formatarHora(hora)}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
