import "server-only";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";
import { carregarAgendamentoAtivo } from "@/lib/atendimento/acesso";
import { liberarAgendamento } from "@/lib/agendamento/liberar-agendamento";

export async function confirmarAgendamento(agendamentoId: string, usuario: UsuarioAtual, agora = new Date()): Promise<void> {
  const venceu = await executarEmTransacao(async (tx) => {
    const agendamento = await carregarAgendamentoAtivo(tx, agendamentoId, usuario);
    if (agendamento.status !== "PENDENTE") {
      throw new ErroDeRegra("STATUS_INVALIDO", "Só é possível confirmar um agendamento pendente.");
    }

    if (agendamento.prazoConfirmacao <= agora) {
      await liberarAgendamento(agendamentoId, { status: "CANCELADO", motivo: "NAO_CONFIRMADO", usuarioId: usuario.id }, tx);
      return true;
    }

    await tx.agendamento.update({
      where: { id: agendamentoId },
      data: { status: "CONFIRMADO", confirmadoEm: agora, eventos: { create: { tipo: "CONFIRMADO", usuarioId: usuario.id } } },
    });
    return false;
  });

  if (venceu) throw new ErroDeRegra("PRAZO_VENCIDO", "O prazo de 48 horas venceu e o horário foi liberado.");
}
