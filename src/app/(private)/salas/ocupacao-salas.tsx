import Link from "next/link";
import { chaveSala, DIAS_DA_SEMANA, DIAS_EXIBIDOS, estaOcupando, formatarHora, FUSO_HORARIO, horariosDaGrade } from "@/lib/agendamento/regras";
import { salaDisponivel } from "@/lib/salas/faixas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";

type Props = {
  unidadeId: string;
  dia: number;
  unidades: { id: string; nome: string }[] | null;
  link: (mudanca: Record<string, number | string>) => string;
  estagiarioId?: string;
};

const DIAS_EM_INGLES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function diaDaUrl(valor: string | string[] | undefined, agora = new Date()): number {
  const pedido = Number(valor);
  if (DIAS_EXIBIDOS.includes(pedido)) return pedido;
  const hoje = DIAS_EM_INGLES.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: FUSO_HORARIO, weekday: "short" }).format(agora));
  return DIAS_EXIBIDOS.includes(hoje) ? hoje : DIAS_EXIBIDOS[0];
}

export async function OcupacaoSalas({ unidadeId, dia, unidades, link, estagiarioId }: Props) {
  const agora = new Date();
  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: {
      horaAbertura: true,
      horaFechamento: true,
      duracaoBlocoMin: true,
      salas: {
        where: { ativa: true },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, disponibilidades: { where: { diaSemana: dia }, select: { diaSemana: true, horaInicio: true, horaFim: true } } },
      },
      agendamentos: {
        where: { diaSemana: dia, estagiarioAtivoChave: { not: null }, sala: { ativa: true } },
        select: { salaId: true, horaInicio: true, status: true, prazoConfirmacao: true, estagiarioAtivoChave: true, estagiarioId: true },
      },
    },
  });
  if (!unidade) return null;

  const horarios = horariosDaGrade(unidade);
  const ocupacao = new Map(
    unidade.agendamentos
      .filter((agendamento) => estaOcupando(agendamento, agora))
      .map((agendamento) => [chaveSala(agendamento.salaId, dia, agendamento.horaInicio), agendamento]),
  );

  const legenda = Object.values(SITUACOES).filter((situacao) => estagiarioId || situacao !== SITUACOES.sua);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="font-semibold">Ocupação</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {unidades && (
            <Tabs value={unidadeId}>
              <TabsList aria-label="Unidade">
                {unidades.map((opcao) => (
                  <TabsTrigger key={opcao.id} value={opcao.id} nativeButton={false} render={<Link href={link({ unidade: opcao.id, pagina: 1 })} scroll={false} />}>
                    {opcao.nome}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          <Tabs value={dia}>
            <TabsList aria-label="Dia da semana">
              {DIAS_EXIBIDOS.map((opcao) => (
                <TabsTrigger key={opcao} value={opcao} nativeButton={false} render={<Link href={link({ dia: opcao })} scroll={false} />}>
                  {DIAS_DA_SEMANA[opcao].slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {unidade.salas.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sala ativa nesta unidade.</p>
        ) : (
          <>
            <ul aria-hidden className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {legenda.map((situacao) => (
                <li key={situacao.texto} className="flex items-center gap-1.5">
                  <span className={`size-3 rounded-sm ${situacao.cor}`} />
                  {situacao.texto}
                </li>
              ))}
            </ul>
            <Table className="table-fixed border-separate border-spacing-0.5 text-xs" style={{ minWidth: `${3 + unidade.salas.length * 2.75}rem` }}>
              <caption className="sr-only">Ocupação das salas na {DIAS_DA_SEMANA[dia]}</caption>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead scope="col" className="h-auto w-12 px-0.5 text-xs font-normal text-muted-foreground">Horário</TableHead>
                  {unidade.salas.map((sala) => (
                    <TableHead key={sala.id} scope="col" title={sala.nome} className="h-auto truncate px-0.5 text-center text-xs font-normal text-muted-foreground">
                      {sala.nome}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios.map((hora) => (
                  <TableRow key={hora} className="border-0 hover:bg-transparent">
                    <TableHead scope="row" className="h-auto px-0.5 text-xs font-normal text-muted-foreground">{formatarHora(hora)}</TableHead>
                    {unidade.salas.map((sala) => {
                      const situacao = situacaoDaCelula(ocupacao.get(chaveSala(sala.id, dia, hora)), estagiarioId, salaDisponivel(sala.disponibilidades, dia, hora, unidade.duracaoBlocoMin));
                      return (
                        <TableCell key={sala.id} title={`${sala.nome}, ${formatarHora(hora)}: ${situacao.texto}`} className={`h-6 rounded-sm p-0 ${situacao.cor}`}>
                          <span className="sr-only">{situacao.texto}</span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const SITUACOES = {
  livre: { texto: "Livre", cor: "bg-muted" },
  indisponivel: { texto: "Indisponível", cor: "bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_3px,transparent_3px,transparent_6px)] ring-1 ring-inset ring-border" },
  pendente: { texto: "Pendente", cor: "bg-secondary" },
  ocupada: { texto: "Ocupada", cor: "bg-primary" },
  sua: { texto: "Sua reserva", cor: "bg-accent ring-1 ring-inset ring-primary" },
};

function situacaoDaCelula(agendamento: { status: string; estagiarioId: string } | undefined, estagiarioId: string | undefined, salaLivreNoHorario: boolean) {
  if (!agendamento) return salaLivreNoHorario ? SITUACOES.livre : SITUACOES.indisponivel;
  if (estagiarioId && agendamento.estagiarioId === estagiarioId) return SITUACOES.sua;
  return agendamento.status === "PENDENTE" ? SITUACOES.pendente : SITUACOES.ocupada;
}
