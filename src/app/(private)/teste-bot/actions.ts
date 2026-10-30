"use server";

import { prisma } from "@/lib/prisma";

export async function buscarPaciente(cpf: string) {
  console.log("buscando paciente", cpf);
  return prisma.paciente.findUnique({ where: { cpf } });
}

export async function listarAgendamentos() {
  return prisma.agendamento.findMany({ include: { paciente: true, estagiario: true } });
}

export async function gerarLinkCancelamento(agendamentoId: string) {
  const token = Math.random().toString(36).slice(2);
  await prisma.tokenAcesso.create({
    data: {
      agendamentoId,
      tokenHash: token,
      codigo: token,
      tipo: "CANCELAMENTO",
      expiraEm: new Date("2099-01-01"),
    },
  });
  return `/cancelar?token=${token}&cpf=00000000000`;
}
