import { unidadeDaAgenda } from "@/lib/agenda/horarios";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { DIAS_EXIBIDOS, horariosDaGrade, OcupacaoSalas } from "../salas/ocupacao-salas";
import { AvisosDaAgenda, BotaoRemoverHorario, BotaoTrocarHorario, FormularioNovoHorario } from "./formularios-agenda";

export default function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  return (
    <PaginaModulo titulo="Minha agenda" card="#2" pendente="nada nesta tela.">
      <MeusHorarios searchParams={searchParams} />
    </PaginaModulo>
  );
}

async function MeusHorarios({ searchParams }: { searchParams: PageProps<"/agenda">["searchParams"] }) {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const unidadeId = unidadeDaAgenda(usuario);
  if (!unidadeId) return <p>Seu cadastro não tem unidade. Fale com a secretaria.</p>;
  const { dia: diaDaUrl } = await searchParams;
  const dia = DIAS_EXIBIDOS.includes(Number(diaDaUrl)) ? Number(diaDaUrl) : DIAS_EXIBIDOS[0];

  const agora = new Date();
  const [horarios, unidade] = await Promise.all([
    prisma.horarioDisponivel.findMany({
      where: { estagiarioId: usuario.id, ativo: true },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: { id: true, diaSemana: true, horaInicio: true, ocupadoPor: { select: { status: true, prazoConfirmacao: true, horarioAtivoId: true } } },
    }),
    prisma.unidade.findUnique({
      where: { id: unidadeId },
      select: { horaAbertura: true, horaFechamento: true, duracaoBlocoMin: true },
    }),
  ]);

  return (
    <AvisosDaAgenda>
      {horarios.length === 0 ? (
        <p>Nenhum horário cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {horarios.map((horario) => {
            const descricao = `${DIAS_DA_SEMANA[horario.diaSemana]} ${formatarHora(horario.horaInicio)}`;
            const comPaciente = horario.ocupadoPor !== null && estaOcupando(horario.ocupadoPor, agora);
            return (
              <li key={horario.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {descricao} — {comPaciente ? "com paciente" : "livre"}
                </span>
                <BotaoRemoverHorario horarioId={horario.id} descricao={descricao} />
                {!comPaciente && unidade && (
                  <BotaoTrocarHorario horario={{ id: horario.id, diaSemana: horario.diaSemana, horaInicio: horario.horaInicio, descricao }} dias={DIAS_EXIBIDOS} horas={horariosDaGrade(unidade)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {unidade && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Novo horário</h2>
          <FormularioNovoHorario dias={DIAS_EXIBIDOS} horas={horariosDaGrade(unidade)} />
        </section>
      )}
      <OcupacaoSalas
        unidadeId={unidadeId}
        dia={dia}
        unidades={null}
        link={({ dia: novoDia }) => `/agenda?dia=${novoDia}`}
      />
    </AvisosDaAgenda>
  );
}
