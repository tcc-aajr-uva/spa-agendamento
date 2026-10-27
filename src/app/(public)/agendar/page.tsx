import { Suspense } from "react";
import Link from "next/link";
import { listarHorariosLivres } from "@/lib/agendamento/horarios-livres";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { agendar, entrarNaLista } from "./actions";
import { FormularioPaciente } from "./formulario-paciente";

type Busca = PageProps<"/agendar">["searchParams"];

export default function AgendarPage({ searchParams }: PageProps<"/agendar">) {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Agendar atendimento</h1>
      <Suspense fallback={<p>Carregando…</p>}>
        <Etapa busca={searchParams} />
      </Suspense>
    </main>
  );
}

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

async function Etapa({ busca }: { busca: Busca }) {
  const parametros = await busca;
  const [unidade, equipe, dia, hora] = ["unidade", "equipe", "dia", "hora"].map((chave) => primeiro(parametros[chave]));
  if (!unidade) return <EscolherUnidade />;
  if (!equipe) return <EscolherEquipe unidadeId={unidade} />;
  if (dia === undefined || hora === undefined) return <EscolherHorario unidadeId={unidade} equipeId={equipe} />;

  return (
    <>
      <p>
        Horário escolhido: {DIAS_DA_SEMANA[Number(dia)]} às {formatarHora(Number(hora))}.{" "}
        <Link className="underline" href={`/agendar?unidade=${unidade}&equipe=${equipe}`}>
          Trocar
        </Link>
      </p>
      <FormularioPaciente
        acao={agendar}
        rotuloBotao="Agendar"
        camposOcultos={{ unidadeId: unidade, equipeId: equipe, diaSemana: dia, horaInicio: hora }}
      />
    </>
  );
}

async function EscolherUnidade() {
  const unidades = await prisma.unidade.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, agendamentoAberto: true },
  });
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">1. Escolha a unidade</h2>
      {unidades.map((unidade) => (
        <Link key={unidade.id} className="underline" href={`/agendar?unidade=${unidade.id}`}>
          {unidade.nome}
          {unidade.agendamentoAberto ? "" : " (agendamento online fechado)"}
        </Link>
      ))}
    </section>
  );
}

async function EscolherEquipe({ unidadeId }: { unidadeId: string }) {
  const equipes = await prisma.equipe.findMany({
    where: { unidadeId, ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">2. Escolha o tipo de atendimento</h2>
      {equipes.map((equipe) => (
        <Link key={equipe.id} className="underline" href={`/agendar?unidade=${unidadeId}&equipe=${equipe.id}`}>
          {equipe.nome}
        </Link>
      ))}
    </section>
  );
}

async function EscolherHorario({ unidadeId, equipeId }: { unidadeId: string; equipeId: string }) {
  const horarios = await listarHorariosLivres(unidadeId, equipeId);

  if (horarios.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <p>Não há horário livre agora. Preencha a inscrição para entrar na lista de espera.</p>
        <FormularioPaciente acao={entrarNaLista} rotuloBotao="Entrar na lista de espera" camposOcultos={{ unidadeId, equipeId }} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">3. Escolha o dia e o horário (semanal)</h2>
      {horarios.map((horario) => (
        <Link
          key={`${horario.diaSemana}-${horario.horaInicio}`}
          className="underline"
          href={`/agendar?unidade=${unidadeId}&equipe=${equipeId}&dia=${horario.diaSemana}&hora=${horario.horaInicio}`}
        >
          {DIAS_DA_SEMANA[horario.diaSemana]} às {formatarHora(horario.horaInicio)}
        </Link>
      ))}
    </section>
  );
}
