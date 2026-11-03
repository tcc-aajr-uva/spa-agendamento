import Link from "next/link";
import { chaveSala, DIAS_DA_SEMANA, estaOcupando, formatarHora, horarioNaGrade } from "@/lib/agendamento/regras";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { Cartao } from "../cartao";

type Props = {
  unidadeId: string;
  dia: number;
  unidades: { id: string; nome: string }[] | null;
  link: (mudanca: Record<string, number | string>) => string;
};

export const DIAS_EXIBIDOS = [1, 2, 3, 4, 5, 6];

export function horariosDaGrade(unidade: { horaAbertura: number; horaFechamento: number; duracaoBlocoMin: number }): number[] {
  const horarios: number[] = [];
  for (let hora = unidade.horaAbertura; hora < unidade.horaFechamento; hora += unidade.duracaoBlocoMin) {
    if (horarioNaGrade(unidade, hora)) horarios.push(hora);
  }
  return horarios;
}

export async function OcupacaoSalas({ unidadeId, dia, unidades, link }: Props) {
  const agora = new Date();
  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: {
      horaAbertura: true,
      horaFechamento: true,
      duracaoBlocoMin: true,
      salas: { where: { ativa: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } },
      agendamentos: {
        where: { diaSemana: dia, horarioAtivoId: { not: null }, sala: { ativa: true } },
        select: { salaId: true, horaInicio: true, status: true, prazoConfirmacao: true, horarioAtivoId: true },
      },
    },
  });
  if (!unidade) return null;

  const horarios = horariosDaGrade(unidade);
  const ocupacao = new Map(
    unidade.agendamentos
      .filter((agendamento) => estaOcupando(agendamento, agora))
      .map((agendamento) => [chaveSala(agendamento.salaId, dia, agendamento.horaInicio), agendamento.status]),
  );

  return (
    <Cartao titulo="Ocupação">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {unidades ? (
          <Tabs value={unidadeId}>
            <TabsList aria-label="Unidade">
              {unidades.map((opcao) => (
                <TabsTrigger key={opcao.id} value={opcao.id} nativeButton={false} render={<Link href={link({ unidade: opcao.id, pagina: 1 })} scroll={false} />}>
                  {opcao.nome}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <span />
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
      {unidade.salas.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma sala ativa nesta unidade.</p>
      ) : (
        <Table className="border-separate border-spacing-1 text-sm">
          <caption className="sr-only">Ocupação das salas na {DIAS_DA_SEMANA[dia]}</caption>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead scope="col" className="h-auto w-16 px-1 text-sm font-normal text-muted-foreground">Horário</TableHead>
              {unidade.salas.map((sala) => (
                <TableHead key={sala.id} scope="col" className="h-auto min-w-20 px-1 text-center text-sm font-normal text-muted-foreground">{sala.nome}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {horarios.map((hora) => (
              <TableRow key={hora} className="border-0 hover:bg-transparent">
                <TableHead scope="row" className="h-auto px-1 text-sm font-normal text-muted-foreground">{formatarHora(hora)}</TableHead>
                {unidade.salas.map((sala) => {
                  const status = ocupacao.get(chaveSala(sala.id, dia, hora));
                  const [texto, cor] = !status
                    ? ["Livre", "bg-muted text-muted-foreground"]
                    : status === "PENDENTE"
                      ? ["Pendente", "bg-secondary text-secondary-foreground"]
                      : ["Ocupada", "bg-primary text-primary-foreground"];
                  return (
                    <TableCell key={sala.id} className={`rounded-md px-1 py-1 text-center ${cor}`}>
                      {texto}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Cartao>
  );
}
