import "server-only";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { hojeNoBrasil } from "@/lib/agendamento/regras";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";

const configuracaoSchema = z.object({
  estagiarioId: z.cuid2(),
  equipeId: z.cuid2(),
  periodoLetivoId: z.cuid2(),
  liberado: z.boolean(),
  limitePacientes: z.coerce.number().int().min(0, "O limite não pode ser negativo.").max(2_147_483_647),
  versao: z.iso.datetime().nullable(),
});

export function podeConfigurarAtendimento(autor: ContextoAutorizacao): boolean {
  return autor.perfil === "ADMINISTRADOR" || autor.perfil === "SUPERVISOR";
}

function filtroDeVinculos(autor: ContextoAutorizacao, estagiarioId: string): Prisma.UsuarioEquipeWhereInput {
  return {
    usuarioId: estagiarioId,
    ativo: true,
    usuario: { perfil: "ESTAGIARIO", ativo: true },
    vinculoUnidade: { ativo: true, unidade: { ativa: true } },
    equipe: { ativa: true, ...(autor.perfil === "SUPERVISOR" ? { supervisorId: autor.id } : {}) },
    ...(autor.perfil !== "ADMINISTRADOR" ? {
      unidadeId: { in: autor.unidades },
      equipeId: { in: autor.equipes },
    } : {}),
  };
}

export async function consultarAtendimentoEstagiario(
  estagiarioId: string, autor: ContextoAutorizacao, equipeId?: string, periodoLetivoId?: string,
) {
  if (!podeConfigurarAtendimento(autor) || !z.cuid2().safeParse(estagiarioId).success) return null;
  const vinculos = await prisma.usuarioEquipe.findMany({
    where: filtroDeVinculos(autor, estagiarioId),
    orderBy: [{ equipe: { unidade: { nome: "asc" } } }, { equipe: { nome: "asc" } }],
    select: { equipe: { select: { id: true, nome: true, unidadeId: true, unidade: { select: { nome: true } } } } },
  });
  const equipes = vinculos.map(({ equipe }) => ({
    id: equipe.id, unidadeId: equipe.unidadeId, nome: `${equipe.unidade.nome} — ${equipe.nome}`,
  }));
  const equipe = equipeId ? equipes.find(({ id }) => id === equipeId) : equipes[0];
  if (!equipe) return { equipes, periodos: [], equipe: null, periodo: null, configuracao: null };
  const periodos = await prisma.periodoLetivo.findMany({
    where: { unidadeId: equipe.unidadeId }, orderBy: { inicio: "asc" },
    select: { id: true, inicio: true, fim: true },
  });
  const hoje = hojeNoBrasil(new Date());
  const periodo = periodoLetivoId
    ? periodos.find(({ id }) => id === periodoLetivoId)
    : periodos.find(({ fim }) => fim >= hoje) ?? periodos.at(-1);
  const configuracao = periodo ? await prisma.configuracaoAtendimentoEstagiario.findUnique({
    where: { estagiarioId_equipeId_periodoLetivoId: { estagiarioId, equipeId: equipe.id, periodoLetivoId: periodo.id } },
    select: { liberado: true, limitePacientes: true, atualizadoEm: true },
  }) : null;
  return { equipes, periodos, equipe, periodo: periodo ?? null, configuracao };
}

export async function salvarAtendimentoEstagiario(
  entrada: z.input<typeof configuracaoSchema>, autor: ContextoAutorizacao,
): Promise<void> {
  if (!podeConfigurarAtendimento(autor)) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Seu perfil não pode configurar o atendimento do estagiário.");
  }
  const resultado = configuracaoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const { estagiarioId, equipeId, periodoLetivoId, liberado, limitePacientes, versao } = resultado.data;
  try {
    await executarEmTransacao(async (tx) => {
      const vinculo = await tx.usuarioEquipe.findFirst({
        where: { AND: [filtroDeVinculos(autor, estagiarioId), { equipeId }] }, select: { unidadeId: true },
      });
      if (!vinculo) throw new ErroDeRegra("SEM_PERMISSAO", "Estagiário ou equipe fora do seu escopo ou inativo.");
      const periodo = await tx.periodoLetivo.findFirst({
        where: { id: periodoLetivoId, unidadeId: vinculo.unidadeId }, select: { id: true },
      });
      if (!periodo) throw new ErroDeRegra("DADOS_INVALIDOS", "O período não pertence à unidade da equipe.");
      const chave = { estagiarioId, equipeId, periodoLetivoId };
      if (versao === null) {
        await tx.configuracaoAtendimentoEstagiario.create({
          data: { ...chave, unidadeId: vinculo.unidadeId, liberado, limitePacientes },
        });
      } else {
        const atualizacao = await tx.configuracaoAtendimentoEstagiario.updateMany({
          where: { ...chave, atualizadoEm: new Date(versao) }, data: { liberado, limitePacientes },
        });
        if (atualizacao.count !== 1) throw conflito();
      }
    });
  } catch (erro) {
    if (violouUnicidade(erro)) throw conflito();
    throw erro;
  }
}

function conflito() {
  return new ErroDeRegra("CONFLITO_CONCORRENTE", "Esta configuração foi alterada em outra sessão. Carregue a versão mais recente.");
}
