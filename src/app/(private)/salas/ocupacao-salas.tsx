import Link from "next/link";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora, horarioNaGrade } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";

type Props = {
  unidadeId: string;
  dia: number;
  unidades: { id: string; nome: string }[] | null;
  link: (mudanca: Record<string, number | string>) => string;
};

// shortcut: segunda a sábado fixos, até o SPA confirmar os dias de atendimento.
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
        // Mesmo critério de "ativo" da criação de agendamento; pendente vencido não ocupa.
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
      .map((agendamento) => [`${agendamento.salaId}:${agendamento.horaInicio}`, agendamento.status]),
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Ocupação</h2>
      {unidades && (
        <nav aria-label="Unidade" className="flex flex-wrap gap-2">
          {unidades.map((opcao) => (
            <Link
              key={opcao.id}
              href={link({ unidade: opcao.id, pagina: 1 })}
              aria-current={opcao.id === unidadeId ? "true" : undefined}
              className={`rounded border px-2 py-1 ${opcao.id === unidadeId ? "font-bold" : ""}`}
            >
              {opcao.nome}
            </Link>
          ))}
        </nav>
      )}
      <nav aria-label="Dia da semana" className="flex flex-wrap gap-2">
        {DIAS_EXIBIDOS.map((opcao) => (
          <Link
            key={opcao}
            href={link({ dia: opcao })}
            aria-current={opcao === dia ? "true" : undefined}
            className={`w-12 rounded border py-1 text-center ${opcao === dia ? "font-bold" : ""}`}
          >
            {DIAS_DA_SEMANA[opcao].slice(0, 3)}
          </Link>
        ))}
      </nav>
      {unidade.salas.length === 0 ? (
        <p>Nenhuma sala ativa nesta unidade.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse text-sm">
            <caption className="sr-only">Ocupação das salas na {DIAS_DA_SEMANA[dia]}</caption>
            <thead>
              <tr>
                <th scope="col" className="border px-2 py-1">Horário</th>
                {unidade.salas.map((sala) => (
                  <th key={sala.id} scope="col" className="w-24 min-w-24 border px-2 py-1">{sala.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horarios.map((hora) => (
                <tr key={hora}>
                  <th scope="row" className="border px-2 py-1">{formatarHora(hora)}</th>
                  {unidade.salas.map((sala) => {
                    const status = ocupacao.get(`${sala.id}:${hora}`);
                    const texto = !status ? "Livre" : status === "PENDENTE" ? "Pendente" : "Ocupada";
                    return (
                      <td key={sala.id} className={`border px-2 py-1 text-center ${status ? "font-bold" : "opacity-70"}`}>
                        {texto}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
