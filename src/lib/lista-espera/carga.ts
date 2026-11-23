import "server-only";
import { FILTRO_RESERVA_ATIVA } from "@/lib/agendamento/regras";
import type { Transacao } from "@/lib/transacao";

export async function contarCarga(tx: Transacao, estagiarioIds: string[]): Promise<Map<string, number>> {
  const [agendamentos, inscricoes] = await Promise.all([
    tx.agendamento.groupBy({ by: ["estagiarioId"], where: { estagiarioId: { in: estagiarioIds }, ...FILTRO_RESERVA_ATIVA }, _count: { _all: true } }),
    tx.listaEspera.groupBy({ by: ["estagiarioId"], where: { estagiarioId: { in: estagiarioIds }, status: "AGUARDANDO" }, _count: { _all: true } }),
  ]);
  const carga = new Map<string, number>();
  for (const linha of [...agendamentos, ...inscricoes]) {
    carga.set(linha.estagiarioId, (carga.get(linha.estagiarioId) ?? 0) + linha._count._all);
  }
  return carga;
}
