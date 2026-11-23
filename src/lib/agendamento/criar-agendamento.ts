import "server-only";
import { z } from "zod";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { carregarInscricaoAguardando, PERFIS_QUE_AGENDAM } from "@/lib/lista-espera/inscricao";
import { salaDisponivel } from "@/lib/salas/faixas";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";
import { carregarUnidadeParaAgendar } from "@/lib/agendamento/autorizacao";
import { liberarPendentesVencidos } from "@/lib/agendamento/liberar-agendamento";
import { chaveEstagiario, chaveSala, hojeNoBrasil, horarioNaGrade, prazoDeConfirmacao, primeiraDataNoDia, type Grade } from "@/lib/agendamento/regras";

export const horarioComSalaSchema = z.object({
  diaSemana: z.coerce.number().int().min(0).max(6),
  horaInicio: z.coerce.number().int().min(0).max(24 * 60 - 1),
  salaId: z.string().min(1, "Escolha a sala."),
});

const agendamentoDaListaSchema = horarioComSalaSchema.extend({ listaEsperaId: z.string().min(1) });

export type HorarioComSala = z.input<typeof horarioComSalaSchema>;
export type AgendamentoDaLista = z.input<typeof agendamentoDaListaSchema>;

export type AgendamentoCriado = {
  agendamentoId: string;
  dataInicio: Date;
  diaSemana: number;
  horaInicio: number;
  sala: string;
};

export async function agendarDaLista(entrada: AgendamentoDaLista, usuario: ContextoAutorizacao, agora = new Date()): Promise<AgendamentoCriado> {
  const dados = agendamentoDaListaSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  try {
    return await executarEmTransacao((tx) => agendarNaTransacao(tx, dados.data, usuario, agora));
  } catch (erro) {
    throw traduzirUnicidade(erro);
  }
}

export function traduzirUnicidade(erro: unknown): unknown {
  if (violouUnicidade(erro, "pacienteAtivoId")) {
    return new ErroDeRegra("PACIENTE_JA_ATIVO", "Este paciente já tem um agendamento ativo.");
  }
  if (violouUnicidade(erro, "estagiarioAtivoChave")) {
    return new ErroDeRegra("HORARIO_OCUPADO", "O estagiário já tem paciente neste dia e horário. Escolha outro.");
  }
  if (violouUnicidade(erro, "salaAtivaChave")) {
    return new ErroDeRegra("HORARIO_OCUPADO", "Esta sala acabou de ser ocupada neste horário. Escolha outra.");
  }
  return erro;
}

export async function validarSalaNoHorario(
  tx: Transacao,
  alvo: { unidadeId: string; salaId: string; diaSemana: number; horaInicio: number },
  grade: Grade,
): Promise<string> {
  if (!horarioNaGrade(grade, alvo.horaInicio)) throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um horário da grade.");

  const sala = await tx.sala.findFirst({
    where: { id: alvo.salaId, unidadeId: alvo.unidadeId, ativa: true },
    select: { nome: true, disponibilidades: { where: { diaSemana: alvo.diaSemana }, select: { diaSemana: true, horaInicio: true, horaFim: true } } },
  });
  if (!sala) throw new ErroDeRegra("NAO_ENCONTRADO", "Sala não encontrada nesta unidade.");
  if (!salaDisponivel(sala.disponibilidades, alvo.diaSemana, alvo.horaInicio, grade.duracaoBlocoMin)) {
    throw new ErroDeRegra("SALA_INDISPONIVEL", `A ${sala.nome} não está disponível neste dia e horário.`);
  }
  return sala.nome;
}

export function dataDeInicio(periodo: { inicio: Date; fim: Date }, diaSemana: number, agora: Date): Date {
  const hoje = hojeNoBrasil(agora);
  const dataInicio = primeiraDataNoDia(diaSemana, periodo.inicio > hoje ? periodo.inicio : hoje);
  if (dataInicio > periodo.fim) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há mais datas neste período letivo.");
  return dataInicio;
}

async function agendarNaTransacao(
  tx: Transacao,
  dados: z.output<typeof agendamentoDaListaSchema>,
  usuario: ContextoAutorizacao,
  agora: Date,
): Promise<AgendamentoCriado> {
  const { listaEsperaId, diaSemana, horaInicio, salaId } = dados;
  const inscricao = await carregarInscricaoAguardando(tx, listaEsperaId, usuario, PERFIS_QUE_AGENDAM);
  if (usuario.perfil === "ESTAGIARIO" && inscricao.estagiarioId !== usuario.id) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Este paciente foi designado para outro estagiário.");
  }

  const { unidadeId, equipeId, estagiarioId, pacienteId } = inscricao;
  const unidade = await carregarUnidadeParaAgendar(tx, unidadeId, equipeId, agora);
  const periodo = unidade.periodos[0];
  if (!periodo) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há período letivo aberto nesta unidade.");

  await liberarPendentesVencidos(tx, { OR: [{ unidadeId }, { estagiarioId }] }, agora);
  const sala = await validarSalaNoHorario(tx, { unidadeId, salaId, diaSemana, horaInicio }, unidade);
  const dataInicio = dataDeInicio(periodo, diaSemana, agora);

  const chamado = await tx.listaEspera.updateMany({
    where: { id: listaEsperaId, status: "AGUARDANDO" },
    data: { status: "CHAMADO", pacienteAtivoId: null },
  });
  if (chamado.count === 0) throw new ErroDeRegra("NAO_ENCONTRADO", "Inscrição não encontrada ou já chamada.");

  const agendamento = await tx.agendamento.create({
    data: {
      unidadeId,
      equipeId,
      estagiarioId,
      salaId,
      pacienteId,
      listaEsperaId,
      diaSemana,
      horaInicio,
      dataInicio,
      dataFim: periodo.fim,
      prazoConfirmacao: prazoDeConfirmacao(agora),
      criadoPorId: usuario.id,
      estagiarioAtivoChave: chaveEstagiario(estagiarioId, diaSemana, horaInicio),
      salaAtivaChave: chaveSala(salaId, diaSemana, horaInicio),
      pacienteAtivoId: pacienteId,
      eventos: { create: { tipo: "CRIADO", usuarioId: usuario.id } },
    },
    select: { id: true },
  });

  return { agendamentoId: agendamento.id, dataInicio, diaSemana, horaInicio, sala };
}
