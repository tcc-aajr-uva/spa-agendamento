import "server-only";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { gerarCodigo, gerarToken, hashToken } from "@/lib/token";
import { executarEmTransacao } from "@/lib/transacao";
import { carregarAgendamentoAtivo } from "@/lib/atendimento/acesso";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export type LinkDeCancelamento = {
  codigo: string;
  token: string;
};

export async function gerarNovoLinkDeCancelamento(agendamentoId: string, usuario: ContextoAutorizacao): Promise<LinkDeCancelamento> {
  return executarEmTransacao(async (tx) => {
    const agendamento = await carregarAgendamentoAtivo(tx, agendamentoId, usuario);
    const atual = await tx.tokenAcesso.findFirst({
      where: { agendamentoId, tipo: "CANCELAMENTO" },
      orderBy: { criadoEm: "desc" },
      select: { id: true, codigo: true },
    });

    const token = gerarToken();
    const dados = { tokenHash: hashToken(token), expiraEm: new Date(agendamento.dataFim.getTime() + UM_DIA_MS) };
    const codigo = atual?.codigo ?? gerarCodigo();
    if (atual) {
      await tx.tokenAcesso.update({ where: { id: atual.id }, data: dados });
    } else {
      await tx.tokenAcesso.create({ data: { ...dados, agendamentoId, codigo, tipo: "CANCELAMENTO" } });
    }

    await tx.eventoAgendamento.create({ data: { agendamentoId, tipo: "LINK_CANCELAMENTO_GERADO", usuarioId: usuario.id } });
    return { codigo, token };
  });
}
