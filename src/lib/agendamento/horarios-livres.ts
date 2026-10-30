import "server-only";
import { prisma } from "@/lib/prisma";
import { filtroAgendamentoAtivo, hojeNoBrasil } from "@/lib/agendamento/regras";

export type HorarioLivre = {
  diaSemana: number;
  horaInicio: number;
};

export async function listarHorariosLivres(unidadeId: string, equipeId: string, agora = new Date()): Promise<HorarioLivre[]> {
  const unidade = await prisma.unidade.findFirst({
    where: { id: unidadeId, ativa: true, equipes: { some: { id: equipeId, ativa: true } } },
    select: {
      _count: { select: { salas: { where: { ativa: true } } } },
      periodos: {
        where: { fim: { gte: hojeNoBrasil(agora) } },
        orderBy: { inicio: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  const periodo = unidade?.periodos[0];
  if (!unidade || !periodo) return [];

  const [horarios, ativos] = await Promise.all([
    prisma.horarioDisponivel.findMany({
      where: {
        ativo: true,
        estagiario: {
          perfil: "ESTAGIARIO",
          ativo: true,
          configuracoesAtendimento: {
            some: {
              unidadeId,
              equipeId,
              periodoLetivoId: periodo.id,
              liberado: true,
              vinculoEquipe: { ativo: true },
            },
          },
        },
      },
      select: {
        id: true,
        diaSemana: true,
        horaInicio: true,
        estagiarioId: true,
        estagiario: {
          select: {
            configuracoesAtendimento: {
              where: { unidadeId, equipeId, periodoLetivoId: periodo.id, liberado: true },
              take: 1,
              select: { limitePacientes: true },
            },
          },
        },
      },
    }),
    prisma.agendamento.findMany({
      where: { unidadeId, ...filtroAgendamentoAtivo(agora) },
      select: { horarioAtivoId: true, estagiarioId: true, diaSemana: true, horaInicio: true },
    }),
  ]);
  const horariosOcupados = new Set(ativos.map((ativo) => ativo.horarioAtivoId));
  const ativosPorEstagiario = contar(ativos.map((ativo) => ativo.estagiarioId));
  const salasOcupadas = contar(ativos.map((ativo) => `${ativo.diaSemana}:${ativo.horaInicio}`));
  const totalSalas = unidade._count.salas;

  const livres = new Map<string, HorarioLivre>();
  for (const horario of horarios) {
    const chave = `${horario.diaSemana}:${horario.horaInicio}`;
    const limitePacientes = horario.estagiario.configuracoesAtendimento[0]?.limitePacientes ?? 0;
    const estagiarioComVaga = (ativosPorEstagiario.get(horario.estagiarioId) ?? 0) < limitePacientes;
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
