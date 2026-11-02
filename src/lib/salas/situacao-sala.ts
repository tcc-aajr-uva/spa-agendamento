import "server-only";
import { filtroAgendamentoAtivo } from "@/lib/agendamento/regras";
import { podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";

export async function alterarSituacaoDaSala(usuario: ContextoAutorizacao, salaId: string, ativar: boolean): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const sala = await tx.sala.findUnique({ where: { id: salaId }, select: { id: true, nome: true, unidadeId: true } });
    if (!sala || !podeAcessar(usuario, { unidadeId: sala.unidadeId })) {
      throw new ErroDeRegra("NAO_ENCONTRADO", "Sala não encontrada.");
    }

    if (!ativar) {
      const ativos = await tx.agendamento.count({ where: { salaId: sala.id, ...filtroAgendamentoAtivo(new Date()) } });
      if (ativos > 0) {
        throw new ErroDeRegra("SALA_EM_USO", `A ${sala.nome} tem ${ativos} agendamento(s) ativo(s). Cancele ou encerre antes de desativar.`);
      }
    }
    await tx.sala.update({ where: { id: sala.id }, data: { ativa: ativar } });
  });
}
