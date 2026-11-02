import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao, violouUnicidade } from "@/lib/transacao";
import { chaveDaEquipe, equipeIdSchema, edicaoEquipeSchema, novaEquipeSchema, versaoEquipeSchema, type EdicaoEquipe, type NovaEquipe, type VersaoEquipe } from "./dados-equipe";
import { atribuirSupervisor } from "@/lib/usuario/vinculos-usuario";
import { filtroDeEquipesVisiveis, podeGerenciarEquipes } from "./escopo-equipe";

export async function criarEquipe(entrada: NovaEquipe, autor: ContextoAutorizacao): Promise<string> {
  exigirGestao(autor);
  const resultado = novaEquipeSchema.safeParse(entrada);
  if (!resultado.success) throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  const dados = resultado.data;
  try {
    return await executarEmTransacao(async (tx) => {
      const unidade = await tx.unidade.findFirst({
        where: {
          id: autor.perfil === "ADMINISTRADOR" ? dados.unidadeId : { equals: dados.unidadeId, in: autor.unidades },
          ativa: true,
        },
        select: { id: true },
      });
      if (!unidade) throw new ErroDeRegra("SEM_PERMISSAO", "Escolha uma unidade ativa do seu escopo.");
      await garantirNomeDisponivel(tx, dados.unidadeId, dados.nome);
      await validarSupervisor(tx, dados.supervisorId, dados.unidadeId, autor);
      const equipe = await tx.equipe.create({ data: { nome: dados.nome, unidadeId: dados.unidadeId }, select: { id: true } });
      if (dados.supervisorId) await atribuirSupervisor(tx, equipe.id, dados.supervisorId);
      return equipe.id;
    });
  } catch (erro) {
    tratarNomeRepetido(erro);
    throw erro;
  }
}

export async function atualizarEquipe(
  equipeId: string, entrada: EdicaoEquipe, versao: VersaoEquipe, autor: ContextoAutorizacao,
): Promise<void> {
  exigirGestao(autor);
  const resultado = edicaoEquipeSchema.safeParse(entrada);
  if (!resultado.success) throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  try {
    await executarEmTransacao(async (tx) => {
      const equipe = await carregarParaAlterar(tx, equipeId, versao, autor);
      const dados = resultado.data;
      await garantirNomeDisponivel(tx, equipe.unidadeId, dados.nome, equipe.id);
      if (dados.supervisorId !== equipe.supervisorId) await validarSupervisor(tx, dados.supervisorId, equipe.unidadeId, autor);
      const atualizacao = await tx.equipe.updateMany({
        where: { id: equipe.id, ...versao }, data: { nome: dados.nome },
      });
      if (atualizacao.count !== 1) throw conflito();
      if (dados.supervisorId !== equipe.supervisorId) await atribuirSupervisor(tx, equipe.id, dados.supervisorId, equipe.supervisorId);
    });
  } catch (erro) {
    tratarNomeRepetido(erro);
    throw erro;
  }
}

export async function alterarAtivacaoEquipe(
  equipeId: string, ativa: boolean, versao: VersaoEquipe, autor: ContextoAutorizacao,
): Promise<void> {
  exigirGestao(autor);
  if (typeof ativa !== "boolean") throw new ErroDeRegra("DADOS_INVALIDOS", "Situação inválida.");
  await executarEmTransacao(async (tx) => {
    const equipe = await carregarParaAlterar(tx, equipeId, versao, autor);
    const atualizacao = await tx.equipe.updateMany({ where: { id: equipe.id, ...versao }, data: { ativa } });
    if (atualizacao.count !== 1) throw conflito();
  });
}

function exigirGestao(autor: ContextoAutorizacao) {
  if (!podeGerenciarEquipes(autor)) throw new ErroDeRegra("SEM_PERMISSAO", "Seu perfil não pode alterar equipes.");
}

async function validarSupervisor(tx: Transacao, supervisorId: string | null, unidadeId: string, autor: ContextoAutorizacao) {
  if (supervisorId === null) return;
  const supervisor = await tx.usuario.findFirst({
    where: {
      id: supervisorId, perfil: "SUPERVISOR", ativo: true,
      ...(autor.perfil !== "ADMINISTRADOR" ? { unidades: { some: { unidadeId, ativo: true, unidade: { ativa: true } } } } : {}),
    },
    select: { id: true },
  });
  if (!supervisor) throw new ErroDeRegra("SEM_PERMISSAO", "Escolha um supervisor ativo disponível para esta unidade.");
}

async function carregarParaAlterar(tx: Transacao, id: string, versao: VersaoEquipe, autor: ContextoAutorizacao) {
  if (!equipeIdSchema.safeParse(id).success || !versaoEquipeSchema.safeParse(versao).success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Equipe ou versão inválida. Atualize a página.");
  }
  const equipe = await tx.equipe.findFirst({
    where: { id, AND: [filtroDeEquipesVisiveis(autor)] },
    select: { id: true, nome: true, unidadeId: true, ativa: true, supervisorId: true },
  });
  if (!equipe) throw new ErroDeRegra("SEM_PERMISSAO", "Equipe não encontrada ou fora do seu escopo.");
  if (chaveDaEquipe(equipe) !== chaveDaEquipe(versao)) throw conflito();
  return equipe;
}

async function garantirNomeDisponivel(tx: Transacao, unidadeId: string, nome: string, ignorarId?: string) {
  const repetida = await tx.equipe.findFirst({
    where: { unidadeId, nome: { equals: nome, mode: "insensitive" }, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
    select: { id: true },
  });
  if (repetida) throw new ErroDeRegra("DADOS_INVALIDOS", "Já existe uma equipe com este nome nesta unidade.");
}

function tratarNomeRepetido(erro: unknown) {
  if (violouUnicidade(erro, "nome")) throw new ErroDeRegra("DADOS_INVALIDOS", "Já existe uma equipe com este nome nesta unidade.");
}

function conflito() {
  return new ErroDeRegra("CONFLITO_CONCORRENTE", "Esta equipe foi alterada em outra sessão. Carregue a versão mais recente antes de tentar novamente.");
}
