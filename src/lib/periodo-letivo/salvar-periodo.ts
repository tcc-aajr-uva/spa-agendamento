import "server-only";

import { hojeNoBrasil } from "@/lib/agendamento/regras";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import { chaveDoPeriodo, dadosPeriodoSchema, datasPeriodoSchema, dataDoPeriodo, periodoIdSchema, type DatasPeriodo } from "./dados-periodo";
import { consultarUnidadeDosPeriodos, podeGerenciarPeriodos } from "./escopo-periodo";
import { filtroDeAgendamentosDoPeriodo, periodoEstaEmUso } from "./consultar-periodo";

export async function criarPeriodo(unidadeId: string, entrada: DatasPeriodo, autor: ContextoAutorizacao): Promise<string> {
  exigirGestao(autor);
  const dados = validarDatas(entrada);
  return executarEmTransacao(async (tx) => {
    await exigirUnidade(tx, unidadeId, autor);
    const datas = converterDatas(dados);
    await garantirSemSobreposicao(tx, unidadeId, datas);
    const periodo = await tx.periodoLetivo.create({ data: { unidadeId, ...datas }, select: { id: true } });
    return periodo.id;
  });
}

export async function atualizarPeriodo(
  unidadeId: string, id: string, entrada: DatasPeriodo, versao: DatasPeriodo, autor: ContextoAutorizacao,
): Promise<void> {
  exigirGestao(autor);
  const dados = validarDatas(entrada);
  await executarEmTransacao(async (tx) => {
    const periodo = await carregarParaAlterar(tx, unidadeId, id, versao, autor);
    if (await periodoEstaEmUso(periodo, tx)) throw periodoEmUso();
    if (chaveDoPeriodo(dados) === chaveDoPeriodo(versao)) return;
    const datas = converterDatas(dados);
    await garantirSemSobreposicao(tx, unidadeId, datas, id);
    const agendamento = await tx.agendamento.findFirst({
      where: filtroDeAgendamentosDoPeriodo({ unidadeId, ...datas }), select: { id: true },
    });
    if (agendamento) throw periodoEmUso();
    const atualizacao = await tx.periodoLetivo.updateMany({ where: { id, unidadeId, ...converterDatas(versao) }, data: datas });
    if (atualizacao.count !== 1) throw conflito();
  });
}

export async function excluirPeriodo(unidadeId: string, id: string, versao: DatasPeriodo, autor: ContextoAutorizacao): Promise<void> {
  exigirGestao(autor);
  await executarEmTransacao(async (tx) => {
    const periodo = await carregarParaAlterar(tx, unidadeId, id, versao, autor);
    if (periodo.inicio <= hojeNoBrasil(new Date())) {
      throw new ErroDeRegra("DADOS_INVALIDOS", "Somente períodos futuros podem ser excluídos.");
    }
    if (await periodoEstaEmUso(periodo, tx)) throw periodoEmUso();
    const exclusao = await tx.periodoLetivo.deleteMany({ where: { id, unidadeId, ...converterDatas(versao) } });
    if (exclusao.count !== 1) throw conflito();
  });
}

function exigirGestao(autor: ContextoAutorizacao) {
  if (!podeGerenciarPeriodos(autor)) throw new ErroDeRegra("SEM_PERMISSAO", "Seu perfil não pode alterar períodos letivos.");
}

function validarDatas(entrada: DatasPeriodo) {
  const resultado = dadosPeriodoSchema.safeParse(entrada);
  if (!resultado.success) throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Datas inválidas.");
  return resultado.data;
}

function converterDatas(datas: DatasPeriodo) {
  return { inicio: new Date(`${datas.inicio}T00:00:00.000Z`), fim: new Date(`${datas.fim}T00:00:00.000Z`) };
}

async function exigirUnidade(tx: Transacao, unidadeId: string, autor: ContextoAutorizacao) {
  if (!await consultarUnidadeDosPeriodos(unidadeId, autor, tx)) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Unidade não encontrada ou fora do seu escopo.");
  }
}

async function carregarParaAlterar(tx: Transacao, unidadeId: string, id: string, versao: DatasPeriodo, autor: ContextoAutorizacao) {
  await exigirUnidade(tx, unidadeId, autor);
  if (!periodoIdSchema.safeParse(id).success || !datasPeriodoSchema.safeParse(versao).success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Período ou versão inválida. Atualize a página.");
  }
  const periodo = await tx.periodoLetivo.findFirst({ where: { id, unidadeId }, select: { id: true, unidadeId: true, inicio: true, fim: true } });
  if (!periodo) throw new ErroDeRegra("NAO_ENCONTRADO", "Período não encontrado nesta unidade.");
  const datas = { inicio: dataDoPeriodo(periodo.inicio), fim: dataDoPeriodo(periodo.fim) };
  if (chaveDoPeriodo(datas) !== chaveDoPeriodo(versao)) throw conflito();
  return periodo;
}

async function garantirSemSobreposicao(tx: Transacao, unidadeId: string, datas: { inicio: Date; fim: Date }, ignorarId?: string) {
  const sobreposto = await tx.periodoLetivo.findFirst({
    where: { unidadeId, inicio: { lte: datas.fim }, fim: { gte: datas.inicio }, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
    select: { id: true },
  });
  if (sobreposto) throw new ErroDeRegra("DADOS_INVALIDOS", "Já existe um período com datas sobrepostas nesta unidade.");
}

function periodoEmUso() {
  return new ErroDeRegra("DADOS_INVALIDOS", "Este período possui configurações de atendimento ou agendamentos e não pode ser alterado ou excluído.");
}

function conflito() {
  return new ErroDeRegra("CONFLITO_CONCORRENTE", "Este período foi alterado em outra sessão. Carregue a versão mais recente.");
}
