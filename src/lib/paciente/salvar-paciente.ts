import "server-only";
import type { DadosPaciente } from "@/lib/paciente/dados-paciente";
import type { Transacao } from "@/lib/transacao";

export async function salvarPaciente(tx: Transacao, paciente: DadosPaciente) {
  return tx.paciente.upsert({
    where: { cpf: paciente.cpf },
    create: paciente,
    update: paciente,
    select: { id: true },
  });
}
