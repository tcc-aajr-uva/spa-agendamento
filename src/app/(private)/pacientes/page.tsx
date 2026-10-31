import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function PacientesPage() {
  return (
    <PaginaModulo
      titulo="Meus pacientes"
      card="#3"
      pendente="confirmar em 48 h, presença, falta, termo, encerrar e transferir (usar liberarAgendamento)."
    >
      <MeusPacientes />
    </PaginaModulo>
  );
}

async function MeusPacientes() {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  const agora = new Date();
  const agendamentos = await prisma.agendamento.findMany({
    where: { estagiarioId: usuario.id, horarioAtivoId: { not: null } },
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    take: 50,
    select: {
      id: true,
      diaSemana: true,
      horaInicio: true,
      status: true,
      prazoConfirmacao: true,
      horarioAtivoId: true,
      paciente: { select: { nome: true, telefone: true, email: true } },
    },
  });

  const ativos = agendamentos.filter((agendamento) => estaOcupando(agendamento, agora));
  if (ativos.length === 0) return <p>Nenhum paciente ativo.</p>;

  return (
    <ul className="list-disc pl-4">
      {ativos.map((agendamento) => (
        <li key={agendamento.id}>
          {agendamento.paciente.nome} — {agendamento.paciente.telefone} — {agendamento.paciente.email} —{" "}
          {DIAS_DA_SEMANA[agendamento.diaSemana]} {formatarHora(agendamento.horaInicio)} — {agendamento.status}
          {agendamento.status === "PENDENTE" &&
            ` (confirmar até ${agendamento.prazoConfirmacao.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })})`}
        </li>
      ))}
    </ul>
  );
}
