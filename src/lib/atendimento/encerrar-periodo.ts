import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { filtroDeUnidades, podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";
import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { liberarEmLote } from "@/lib/agendamento/liberar-agendamento";
import { hojeNoBrasil } from "@/lib/agendamento/regras";

export function filtroPeriodoEncerrado(agora: Date): Prisma.AgendamentoWhereInput {
  return { horarioAtivoId: { not: null }, dataFim: { lt: hojeNoBrasil(agora) } };
}

export async function contarPeriodoEncerrado(tx: Prisma.TransactionClient, usuario: ContextoAutorizacao, agora = new Date()) {
  const porUnidade = await tx.agendamento.groupBy({
    by: ["unidadeId"],
    where: { ...filtroDeUnidades(usuario), ...filtroPeriodoEncerrado(agora) },
    _count: { _all: true },
  });
  if (porUnidade.length === 0) return [];

  const unidades = await tx.unidade.findMany({
    where: { id: { in: porUnidade.map((linha) => linha.unidadeId) } },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
  const quantidade = new Map(porUnidade.map((linha) => [linha.unidadeId, linha._count._all]));
  return unidades.map((unidade) => ({ ...unidade, quantidade: quantidade.get(unidade.id) ?? 0 }));
}

export async function encerrarPeriodo(unidadeId: string, usuario: ContextoAutorizacao, agora = new Date()): Promise<number> {
  if (!PERFIS_DA_SECRETARIA.includes(usuario.perfil) || !podeAcessar(usuario, { unidadeId })) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode encerrar o período desta unidade.");
  }

  return executarEmTransacao(async (tx) => {
    const encerrados = await tx.agendamento.findMany({
      where: { unidadeId, ...filtroPeriodoEncerrado(agora) },
      select: { id: true },
    });
    if (encerrados.length === 0) return 0;

    const ids = encerrados.map((encerrado) => encerrado.id);
    await liberarEmLote(tx, ids, { status: "ENCERRADO", motivo: "FIM_DO_PERIODO", usuarioId: usuario.id }, agora);
    return ids.length;
  });
}
