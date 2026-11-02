import "server-only";
import { z } from "zod";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";
import { carregarAgendamentoAtivo } from "@/lib/atendimento/acesso";
import { liberarAgendamento } from "@/lib/agendamento/liberar-agendamento";
import { DIAS_DA_SEMANA, FALTAS_SEGUIDAS_PARA_ENCERRAR, hojeNoBrasil } from "@/lib/agendamento/regras";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const sessaoSchema = z
  .object({
    data: z.iso.date("Data inválida.").transform((data) => new Date(`${data}T00:00:00Z`)),
    presenca: z.enum(["PRESENTE", "FALTA", "FALTA_JUSTIFICADA"], "Escolha a presença."),
    termoAssinado: z.boolean().optional(),
  })
  .refine((sessao) => !sessao.termoAssinado || sessao.presenca === "PRESENTE", {
    message: "O termo só pode ser marcado numa sessão com o paciente presente.",
    path: ["termoAssinado"],
  });

export type NovaSessao = {
  data: string;
  presenca: string;
  termoAssinado?: boolean;
};

export type ResultadoSessao = "REGISTRADA" | "CANCELADO_FALTA_PRIMEIRA_SESSAO" | "ENCERRADO_TRES_FALTAS";

type Periodo = { diaSemana: number; dataInicio: Date; dataFim: Date };

export function ultimaDataDeSessao(periodo: Periodo, agora: Date): Date | null {
  const hoje = hojeNoBrasil(agora);
  const limite = periodo.dataFim < hoje ? periodo.dataFim : hoje;
  const diasDesde = (limite.getUTCDay() - periodo.diaSemana + 7) % 7;
  const data = new Date(limite.getTime() - diasDesde * UM_DIA_MS);
  return data < periodo.dataInicio ? null : data;
}

export async function registrarSessao(
  agendamentoId: string,
  entrada: NovaSessao,
  usuario: ContextoAutorizacao,
  agora = new Date(),
): Promise<ResultadoSessao> {
  const dados = sessaoSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  try {
    return await executarEmTransacao((tx) => registrarNaTransacao(tx, agendamentoId, dados.data, usuario, agora));
  } catch (erro) {
    if (violouUnicidade(erro)) throw new ErroDeRegra("SESSAO_JA_REGISTRADA", "Já existe uma sessão registrada nesta data.");
    throw erro;
  }
}

async function registrarNaTransacao(
  tx: Transacao,
  agendamentoId: string,
  sessao: z.output<typeof sessaoSchema>,
  usuario: ContextoAutorizacao,
  agora: Date,
): Promise<ResultadoSessao> {
  const agendamento = await carregarAgendamentoAtivo(tx, agendamentoId, usuario);
  if (agendamento.status !== "CONFIRMADO") {
    throw new ErroDeRegra("STATUS_INVALIDO", "Confirme o agendamento antes de registrar sessões.");
  }
  validarData(sessao.data, agendamento, agora);

  await tx.sessao.create({
    data: { agendamentoId, data: sessao.data, presenca: sessao.presenca, registradoPorId: usuario.id },
  });

  if (sessao.presenca !== "PRESENTE") {
    const justificada = sessao.presenca === "FALTA_JUSTIFICADA" ? " (justificada)" : "";
    await tx.eventoAgendamento.create({
      data: { agendamentoId, tipo: "FALTA", usuarioId: usuario.id, observacao: `${dataIso(sessao.data)}${justificada}` },
    });
  }

  if (sessao.termoAssinado && !agendamento.termoAssinadoEm) {
    await tx.agendamento.update({
      where: { id: agendamentoId },
      data: { termoAssinadoEm: agora, eventos: { create: { tipo: "TERMO_ASSINADO", usuarioId: usuario.id } } },
    });
  }

  const ultimas = await tx.sessao.findMany({
    where: { agendamentoId },
    orderBy: { data: "desc" },
    take: FALTAS_SEGUIDAS_PARA_ENCERRAR,
    select: { presenca: true },
  });

  if (ultimas.length === 1 && sessao.presenca === "FALTA") {
    await liberarAgendamento(agendamentoId, { status: "CANCELADO", motivo: "FALTA_PRIMEIRA_SESSAO", usuarioId: usuario.id }, tx);
    return "CANCELADO_FALTA_PRIMEIRA_SESSAO";
  }

  const faltasSeguidas = ultimas.length === FALTAS_SEGUIDAS_PARA_ENCERRAR && ultimas.every((ultima) => ultima.presenca !== "PRESENTE");
  if (faltasSeguidas) {
    await liberarAgendamento(agendamentoId, { status: "ENCERRADO", motivo: "TRES_FALTAS", usuarioId: usuario.id }, tx);
    return "ENCERRADO_TRES_FALTAS";
  }

  return "REGISTRADA";
}

function validarData(data: Date, agendamento: Periodo, agora: Date): void {
  if (data.getUTCDay() !== agendamento.diaSemana) {
    throw new ErroDeRegra("DATA_INVALIDA", `A sessão deste paciente é às ${DIAS_DA_SEMANA[agendamento.diaSemana].toLowerCase()}s.`);
  }
  if (data < agendamento.dataInicio || data > agendamento.dataFim) {
    throw new ErroDeRegra("DATA_INVALIDA", "A data está fora do período do atendimento.");
  }
  if (data > hojeNoBrasil(agora)) {
    throw new ErroDeRegra("DATA_INVALIDA", "Não é possível registrar uma sessão futura.");
  }
}

function dataIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}
