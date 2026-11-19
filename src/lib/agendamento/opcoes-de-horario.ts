import "server-only";
import { prisma } from "@/lib/prisma";
import { salaDisponivel } from "@/lib/salas/faixas";
import { DIAS_EXIBIDOS, chaveEstagiario, chaveSala, estaOcupando, horariosDaGrade, turnoDoHorario } from "@/lib/agendamento/regras";

export type OpcaoDeHorario = {
  diaSemana: number;
  horaInicio: number;
  preferido: boolean;
  salas: { id: string; nome: string }[];
};

export type ConsultaDeOpcoes = {
  unidadeId: string;
  estagiarioId: string;
  ignorarAgendamentoId?: string;
};

export async function listarOpcoesDeHorario({ unidadeId, estagiarioId, ignorarAgendamentoId }: ConsultaDeOpcoes, agora = new Date()): Promise<OpcaoDeHorario[]> {
  const [unidade, ocupados, preferencias] = await Promise.all([
    prisma.unidade.findUnique({
      where: { id: unidadeId },
      select: {
        horaAbertura: true,
        horaFechamento: true,
        duracaoBlocoMin: true,
        salas: {
          where: { ativa: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, disponibilidades: { select: { diaSemana: true, horaInicio: true, horaFim: true } } },
        },
      },
    }),
    prisma.agendamento.findMany({
      where: {
        OR: [{ unidadeId }, { estagiarioId }],
        estagiarioAtivoChave: { not: null },
        ...(ignorarAgendamentoId ? { id: { not: ignorarAgendamentoId } } : {}),
      },
      select: { salaAtivaChave: true, estagiarioAtivoChave: true, status: true, prazoConfirmacao: true },
    }),
    prisma.preferenciaEstagiario.findMany({ where: { estagiarioId }, select: { diaSemana: true, turno: true } }),
  ]);
  if (!unidade) return [];

  const ativos = ocupados.filter((ocupado) => estaOcupando(ocupado, agora));
  const salasOcupadas = new Set(ativos.map((ativo) => ativo.salaAtivaChave));
  const estagiarioOcupado = new Set(ativos.map((ativo) => ativo.estagiarioAtivoChave));
  const preferidos = new Set(preferencias.map((preferencia) => `${preferencia.diaSemana}:${preferencia.turno}`));
  const horas = horariosDaGrade(unidade);

  return DIAS_EXIBIDOS.flatMap((diaSemana) =>
    horas.flatMap((horaInicio) => {
      if (estagiarioOcupado.has(chaveEstagiario(estagiarioId, diaSemana, horaInicio))) return [];
      const salas = unidade.salas
        .filter((sala) => salaDisponivel(sala.disponibilidades, diaSemana, horaInicio, unidade.duracaoBlocoMin))
        .filter((sala) => !salasOcupadas.has(chaveSala(sala.id, diaSemana, horaInicio)))
        .map((sala) => ({ id: sala.id, nome: sala.nome }));
      if (salas.length === 0) return [];
      return [{ diaSemana, horaInicio, preferido: preferidos.has(`${diaSemana}:${turnoDoHorario(horaInicio)}`), salas }];
    }),
  );
}
