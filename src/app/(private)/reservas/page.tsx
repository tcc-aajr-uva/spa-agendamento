import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { BotaoCancelarReserva } from "./botao-cancelar";

export default function ReservasPage() {
  return (
    <PaginaModulo titulo="Minhas reservas" card="#2" pendente="remarcar.">
      <MinhasReservas />
    </PaginaModulo>
  );
}

async function MinhasReservas() {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  const reservas = await prisma.agendamento.findMany({
    where: { estagiarioId: usuario.id },
    orderBy: [{ criadoEm: "desc" }],
    take: 50,
    select: {
      id: true,
      diaSemana: true,
      horaInicio: true,
      status: true,
      horarioAtivoId: true,
      sala: { select: { nome: true } },
    },
  });

  if (reservas.length === 0) return <p>Nenhuma reserva.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {reservas.map((reserva) => {
        const descricao = `${DIAS_DA_SEMANA[reserva.diaSemana]} ${formatarHora(reserva.horaInicio)}`;
        return (
          <li key={reserva.id} className="flex flex-wrap items-center gap-2">
            <span>
              {descricao} — {reserva.sala.nome} — {reserva.status}
            </span>
            {reserva.horarioAtivoId && <BotaoCancelarReserva agendamentoId={reserva.id} descricao={descricao} />}
          </li>
        );
      })}
    </ul>
  );
}
