import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function AgendaPage() {
  return (
    <PaginaModulo
      titulo="Minha agenda"
      card="#2"
      pendente="cadastrar, editar e remover horários (usar horarioNaGrade) vendo a ocupação das salas."
    >
      <MeusHorarios />
    </PaginaModulo>
  );
}

async function MeusHorarios() {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const horarios = await prisma.horarioDisponivel.findMany({
    where: { estagiarioId: usuario.id },
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    select: { id: true, diaSemana: true, horaInicio: true, ativo: true, ocupadoPor: { select: { status: true } } },
  });

  if (horarios.length === 0) return <p>Nenhum horário cadastrado.</p>;

  return (
    <ul className="list-disc pl-4">
      {horarios.map((horario) => (
        <li key={horario.id}>
          {DIAS_DA_SEMANA[horario.diaSemana]} {formatarHora(horario.horaInicio)} —{" "}
          {horario.ocupadoPor ? `ocupado (${horario.ocupadoPor.status})` : "livre"}
          {horario.ativo ? "" : " (inativo)"}
        </li>
      ))}
    </ul>
  );
}
