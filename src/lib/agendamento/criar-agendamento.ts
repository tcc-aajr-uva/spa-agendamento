import "server-only";
import { z } from "zod";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { dadosPacienteSchema } from "@/lib/paciente/dados-paciente";
import { salvarPaciente } from "@/lib/paciente/salvar-paciente";
import { gerarCodigo, gerarToken, hashToken } from "@/lib/token";
import { executarEmTransacao, violouUnicidade, type Transacao } from "@/lib/transacao";
import { autorizarAgendamento, carregarUnidadeParaAgendar, garantirPacienteSemVinculoAtivo } from "@/lib/agendamento/autorizacao";
import { liberarPendentesVencidos } from "@/lib/agendamento/liberar-agendamento";
import { chaveSala, hojeNoBrasil, prazoDeConfirmacao, primeiraDataNoDia } from "@/lib/agendamento/regras";

export const novoAgendamentoSchema = z.object({
  unidadeId: z.string().min(1),
  equipeId: z.string().min(1),
  diaSemana: z.coerce.number().int().min(0).max(6),
  horaInicio: z.coerce.number().int().min(0).max(24 * 60 - 1),
  paciente: dadosPacienteSchema,
  listaEsperaId: z.string().min(1).optional(),
});

export type NovoAgendamento = z.input<typeof novoAgendamentoSchema>;

export type AgendamentoCriado = {
  agendamentoId: string;
  codigo: string;
  token: string;
  dataInicio: Date;
  diaSemana: number;
  horaInicio: number;
};

export async function criarAgendamento(entrada: NovoAgendamento, usuario: ContextoAutorizacao | null, agora = new Date()): Promise<AgendamentoCriado> {
  const dados = novoAgendamentoSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  try {
    return await executarEmTransacao((tx) => criarNaTransacao(tx, dados.data, usuario, agora));
  } catch (erro) {
    if (violouUnicidade(erro, "pacienteAtivoId")) {
      throw new ErroDeRegra("PACIENTE_JA_ATIVO", "Este CPF já tem um agendamento ativo ou uma posição na lista de espera.");
    }
    if (violouUnicidade(erro)) {
      throw new ErroDeRegra("HORARIO_OCUPADO", "Este horário acabou de ser ocupado. Escolha outro.");
    }
    throw erro;
  }
}

async function criarNaTransacao(
  tx: Transacao,
  dados: z.output<typeof novoAgendamentoSchema>,
  usuario: ContextoAutorizacao | null,
  agora: Date,
): Promise<AgendamentoCriado> {
  const { unidadeId, equipeId, diaSemana, horaInicio, listaEsperaId } = dados;
  const unidade = await carregarUnidadeParaAgendar(tx, unidadeId, equipeId, agora);
  autorizarAgendamento(unidade, equipeId, usuario, listaEsperaId !== undefined);

  const periodo = unidade.periodos[0];
  if (!periodo) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há período letivo aberto nesta unidade.");

  await liberarPendentesVencidos(tx, { OR: [{ unidadeId }, { paciente: { cpf: dados.paciente.cpf } }] }, agora);
  await garantirPacienteSemVinculoAtivo(tx, dados.paciente.cpf, listaEsperaId);

  const horario = await escolherHorario(
    tx,
    { unidadeId, equipeId, periodoLetivoId: periodo.id, diaSemana, horaInicio },
    usuario,
  );
  const salaId = await escolherSala(tx, unidadeId, diaSemana, horaInicio);
  const paciente = await salvarPaciente(tx, dados.paciente);

  if (listaEsperaId) {
    const chamado = await tx.listaEspera.updateMany({
      where: { id: listaEsperaId, pacienteId: paciente.id, equipeId, status: "AGUARDANDO" },
      data: { status: "CHAMADO", pacienteAtivoId: null },
    });
    if (chamado.count === 0) throw new ErroDeRegra("NAO_ENCONTRADO", "Inscrição da lista de espera não encontrada.");
  }

  const hoje = hojeNoBrasil(agora);
  const dataInicio = primeiraDataNoDia(diaSemana, periodo.inicio > hoje ? periodo.inicio : hoje);
  if (dataInicio > periodo.fim) throw new ErroDeRegra("SEM_PERIODO_LETIVO", "Não há mais datas neste período letivo.");

  const token = gerarToken();
  const codigo = gerarCodigo();
  const agendamento = await tx.agendamento.create({
    data: {
      unidadeId,
      equipeId,
      horarioDisponivelId: horario.id,
      estagiarioId: horario.estagiarioId,
      salaId,
      pacienteId: paciente.id,
      diaSemana,
      horaInicio,
      dataInicio,
      dataFim: periodo.fim,
      prazoConfirmacao: prazoDeConfirmacao(agora),
      criadoPorId: usuario?.id ?? null,
      horarioAtivoId: horario.id,
      salaAtivaChave: chaveSala(salaId, diaSemana, horaInicio),
      pacienteAtivoId: paciente.id,
      eventos: { create: { tipo: "CRIADO", usuarioId: usuario?.id ?? null } },
      tokens: {
        create: {
          tokenHash: hashToken(token),
          codigo,
          tipo: "CANCELAMENTO",
          expiraEm: new Date(periodo.fim.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    },
    select: { id: true },
  });

  return { agendamentoId: agendamento.id, codigo, token, dataInicio, diaSemana, horaInicio };
}

async function escolherHorario(
  tx: Transacao,
  alvo: { unidadeId: string; equipeId: string; periodoLetivoId: string; diaSemana: number; horaInicio: number },
  usuario: ContextoAutorizacao | null,
) {
  const candidatos = await tx.horarioDisponivel.findMany({
    where: {
      diaSemana: alvo.diaSemana,
      horaInicio: alvo.horaInicio,
      ativo: true,
      ocupadoPor: { is: null },
      estagiario: {
        perfil: "ESTAGIARIO",
        ativo: true,
        configuracoesAtendimento: {
          some: {
            unidadeId: alvo.unidadeId,
            equipeId: alvo.equipeId,
            periodoLetivoId: alvo.periodoLetivoId,
            liberado: true,
            vinculoEquipe: { ativo: true },
          },
        },
        ...(usuario?.perfil === "ESTAGIARIO" ? { id: usuario.id } : {}),
      },
    },
    select: {
      id: true,
      estagiarioId: true,
      estagiario: {
        select: {
          configuracoesAtendimento: {
            where: {
              unidadeId: alvo.unidadeId,
              equipeId: alvo.equipeId,
              periodoLetivoId: alvo.periodoLetivoId,
              liberado: true,
            },
            take: 1,
            select: { limitePacientes: true },
          },
        },
      },
    },
  });
  if (candidatos.length === 0) throw new ErroDeRegra("HORARIO_OCUPADO", "Este horário não está mais disponível. Escolha outro.");

  const carga = await tx.agendamento.groupBy({
    by: ["estagiarioId"],
    where: { estagiarioId: { in: candidatos.map((candidato) => candidato.estagiarioId) }, horarioAtivoId: { not: null } },
    _count: { _all: true },
  });
  const ativosPorEstagiario = new Map(carga.map((linha) => [linha.estagiarioId, linha._count._all]));

  const escolhido = candidatos
    .map((candidato) => ({ ...candidato, ativos: ativosPorEstagiario.get(candidato.estagiarioId) ?? 0 }))
    .filter((candidato) => candidato.ativos < (candidato.estagiario.configuracoesAtendimento[0]?.limitePacientes ?? 0))
    .sort((a, b) => a.ativos - b.ativos)[0];
  if (!escolhido) throw new ErroDeRegra("HORARIO_OCUPADO", "Este horário não está mais disponível. Escolha outro.");
  return escolhido;
}

async function escolherSala(tx: Transacao, unidadeId: string, diaSemana: number, horaInicio: number): Promise<string> {
  const salas = await tx.sala.findMany({
    where: { unidadeId, ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true },
  });
  const chaves = salas.map((sala) => chaveSala(sala.id, diaSemana, horaInicio));
  const ocupadas = await tx.agendamento.findMany({
    where: { salaAtivaChave: { in: chaves } },
    select: { salaAtivaChave: true },
  });
  const chavesOcupadas = new Set(ocupadas.map((ocupada) => ocupada.salaAtivaChave));
  const livre = salas.find((sala) => !chavesOcupadas.has(chaveSala(sala.id, diaSemana, horaInicio)));
  if (!livre) throw new ErroDeRegra("SEM_SALA_LIVRE", "Não há sala livre neste horário. Escolha outro.");
  return livre.id;
}
