import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { BotaoCancelarReserva } from "./botao-cancelar";
import { BotaoRemarcarReserva } from "./botao-remarcar";

export default function ReservasPage() {
  return (
    <PaginaModulo titulo="Minhas reservas" card="#2" pendente="remarcar só uma semana.">
      <MinhasReservas />
    </PaginaModulo>
  );
}

async function MinhasReservas() {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  const agora = new Date();
  const [reservas, horarios] = await Promise.all([
    prisma.agendamento.findMany({
      where: { estagiarioId: usuario.id },
      orderBy: [{ criadoEm: "desc" }],
      take: 50,
      select: {
        id: true,
        diaSemana: true,
        horaInicio: true,
        status: true,
        prazoConfirmacao: true,
        horarioAtivoId: true,
        sala: { select: { nome: true } },
      },
    }),
    prisma.horarioDisponivel.findMany({
      where: { estagiarioId: usuario.id, ativo: true },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: { id: true, diaSemana: true, horaInicio: true, ocupadoPor: { select: { status: true, prazoConfirmacao: true, horarioAtivoId: true } } },
    }),
  ]);

  if (reservas.length === 0) return <p>Nenhuma reserva.</p>;

  const horariosLivres = horarios
    .filter((horario) => horario.ocupadoPor === null || !estaOcupando(horario.ocupadoPor, agora))
    .map((horario) => ({ id: horario.id, descricao: descrever(horario.diaSemana, horario.horaInicio) }));

  return (
    <ul className="flex flex-col gap-2">
      {reservas.map((reserva) => {
        const descricao = descrever(reserva.diaSemana, reserva.horaInicio);
        return (
          <li key={reserva.id} className="flex flex-wrap items-center gap-2">
            <span>
              {descricao} — {reserva.sala.nome} — {reserva.status}
            </span>
            {reserva.horarioAtivoId && <BotaoCancelarReserva agendamentoId={reserva.id} descricao={descricao} />}
            {estaOcupando(reserva, agora) && <BotaoRemarcarReserva agendamentoId={reserva.id} descricao={descricao} horarios={horariosLivres} />}
          </li>
        );
      })}
    </ul>
  );
}

function descrever(diaSemana: number, horaInicio: number): string {
  return `${DIAS_DA_SEMANA[diaSemana]} ${formatarHora(horaInicio)}`;
}
