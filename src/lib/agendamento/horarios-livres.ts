import "server-only";
import { prisma } from "@/lib/prisma";
import { filtroAgendamentoAtivo, hojeNoBrasil } from "@/lib/agendamento/regras";

export type HorarioLivre = {
  diaSemana: number;
  horaInicio: number;
};

export type FiltroHorarios = {
  estagiarioId?: string;
};

export async function listarHorariosLivres(
  unidadeId: string,
  equipeId: string,
  filtro: FiltroHorarios = {},
  agora = new Date(),
): Promise<HorarioLivre[]> {
  const [unidade, horarios, ativos] = await Promise.all([
    prisma.unidade.findFirst({
      where: { id: unidadeId, ativa: true, periodos: { some: { fim: { gte: hojeNoBrasil(agora) } } } },
      select: { _count: { select: { salas: { where: { ativa: true } } } } },
    }),
    prisma.horarioDisponivel.findMany({
      where: {
        ativo: true,
        ...(filtro.estagiarioId ? { estagiarioId: filtro.estagiarioId } : {}),
        estagiario: { perfil: "ESTAGIARIO", ativo: true, liberado: true, unidadeId, equipeId },
      },
      select: { id: true, diaSemana: true, horaInicio: true, estagiarioId: true, estagiario: { select: { limitePacientes: true } } },
    }),
    prisma.agendamento.findMany({
      where: { unidadeId, ...filtroAgendamentoAtivo(agora) },
      select: { horarioAtivoId: true, estagiarioId: true, diaSemana: true, horaInicio: true },
    }),
  ]);
  if (!unidade) return [];

  const horariosOcupados = new Set(ativos.map((ativo) => ativo.horarioAtivoId));
  const ativosPorEstagiario = contar(ativos.map((ativo) => ativo.estagiarioId));
  const salasOcupadas = contar(ativos.map((ativo) => `${ativo.diaSemana}:${ativo.horaInicio}`));
  const totalSalas = unidade._count.salas;

  const livres = new Map<string, HorarioLivre>();
  for (const horario of horarios) {
    const chave = `${horario.diaSemana}:${horario.horaInicio}`;
    const estagiarioComVaga = (ativosPorEstagiario.get(horario.estagiarioId) ?? 0) < horario.estagiario.limitePacientes;
    const temSala = (salasOcupadas.get(chave) ?? 0) < totalSalas;
    if (!horariosOcupados.has(horario.id) && estagiarioComVaga && temSala) {
      livres.set(chave, { diaSemana: horario.diaSemana, horaInicio: horario.horaInicio });
    }
  }

  return [...livres.values()].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio - b.horaInicio);
}

function contar(chaves: string[]): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const chave of chaves) contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  return contagem;
}
