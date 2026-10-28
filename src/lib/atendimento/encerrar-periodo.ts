import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { filtroDeUnidade, podeAcessar } from "@/lib/auth/permissao";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";
import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { hojeNoBrasil } from "@/lib/agendamento/regras";

export function filtroPeriodoEncerrado(agora: Date): Prisma.AgendamentoWhereInput {
  return { horarioAtivoId: { not: null }, dataFim: { lt: hojeNoBrasil(agora) } };
}

export async function contarPeriodoEncerrado(tx: Prisma.TransactionClient, usuario: UsuarioAtual, agora = new Date()) {
  const porUnidade = await tx.agendamento.groupBy({
    by: ["unidadeId"],
    where: { ...filtroDeUnidade(usuario), ...filtroPeriodoEncerrado(agora) },
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

export async function encerrarPeriodo(unidadeId: string, usuario: UsuarioAtual, agora = new Date()): Promise<number> {
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
    await tx.agendamento.updateMany({
      where: { id: { in: ids } },
      data: {
        horarioAtivoId: null,
        salaAtivaChave: null,
        pacienteAtivoId: null,
        status: "ENCERRADO",
        motivoEncerramento: "FIM_DO_PERIODO",
        encerradoEm: agora,
      },
    });
    await tx.eventoAgendamento.createMany({
      data: ids.map((agendamentoId) => ({ agendamentoId, tipo: "ENCERRADO" as const, usuarioId: usuario.id, observacao: "FIM_DO_PERIODO" })),
    });
    return ids.length;
  });
}
