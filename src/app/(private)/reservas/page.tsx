import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function ReservasPage() {
  return (
    <PaginaModulo titulo="Minhas reservas" card="#2" pendente="remarcar e cancelar (usar liberarAgendamento).">
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
    select: { id: true, diaSemana: true, horaInicio: true, status: true, sala: { select: { nome: true } } },
  });

  if (reservas.length === 0) return <p>Nenhuma reserva.</p>;

  return (
    <ul className="list-disc pl-4">
      {reservas.map((reserva) => (
        <li key={reserva.id}>
          {DIAS_DA_SEMANA[reserva.diaSemana]} {formatarHora(reserva.horaInicio)} — {reserva.sala.nome} — {reserva.status}
        </li>
      ))}
    </ul>
  );
}
