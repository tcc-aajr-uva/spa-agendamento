import "server-only";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { prisma } from "@/lib/prisma";
import { criarAgendamento, type AgendamentoCriado } from "@/lib/agendamento/criar-agendamento";
import { carregarInscricaoAguardando } from "@/lib/lista-espera/inscricao";

export type HorarioEscolhido = {
  diaSemana: string | number;
  horaInicio: string | number;
};

export async function chamarDaLista(
  listaEsperaId: string,
  horario: HorarioEscolhido,
  usuario: UsuarioAtual,
  agora = new Date(),
): Promise<AgendamentoCriado> {
  const { unidadeId, equipeId, paciente } = await carregarInscricaoAguardando(prisma, listaEsperaId, usuario);

  return criarAgendamento(
    {
      unidadeId,
      equipeId,
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      listaEsperaId,
      paciente: {
        nome: paciente.nome,
        cpf: paciente.cpf,
        dataNascimento: paciente.dataNascimento.toISOString().slice(0, 10),
        telefone: paciente.telefone,
        email: paciente.email,
        responsavelNome: paciente.responsavelNome ?? undefined,
        responsavelCpf: paciente.responsavelCpf ?? undefined,
      },
    },
    usuario,
    agora,
  );
}
