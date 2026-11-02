import "server-only";
import { z } from "zod";
import type { StatusAgendamento } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";
import { carregarAgendamentoAtivo } from "@/lib/atendimento/acesso";
import { liberarAgendamento } from "@/lib/agendamento/liberar-agendamento";

const MOTIVOS = ["NAO_LOCALIZADO", "DESISTENCIA", "ALTA", "CANCELADO_PELO_ESTAGIARIO"] as const;

export type MotivoDeEncerramento = (typeof MOTIVOS)[number];

const MOTIVOS_POR_STATUS: Partial<Record<StatusAgendamento, readonly MotivoDeEncerramento[]>> = {
  PENDENTE: ["NAO_LOCALIZADO", "DESISTENCIA"],
  CONFIRMADO: ["DESISTENCIA", "ALTA", "CANCELADO_PELO_ESTAGIARIO"],
};

export const encerramentoSchema = z.object({
  motivo: z.enum(MOTIVOS, "Escolha o motivo."),
  observacao: z
    .string()
    .trim()
    .max(200, "Observação com no máximo 200 caracteres.")
    .optional()
    .transform((valor) => valor || undefined),
});

export type Encerramento = {
  motivo: string;
  observacao?: string;
};

export function motivosDeEncerramento(status: StatusAgendamento): readonly MotivoDeEncerramento[] {
  return MOTIVOS_POR_STATUS[status] ?? [];
}

export async function encerrarAtendimento(agendamentoId: string, entrada: Encerramento, usuario: ContextoAutorizacao): Promise<void> {
  const dados = encerramentoSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");
  const { motivo, observacao } = dados.data;

  await executarEmTransacao(async (tx) => {
    const agendamento = await carregarAgendamentoAtivo(tx, agendamentoId, usuario);
    if (!motivosDeEncerramento(agendamento.status).includes(motivo)) {
      throw new ErroDeRegra("STATUS_INVALIDO", "Este motivo não vale para um agendamento neste status.");
    }

    await liberarAgendamento(
      agendamentoId,
      {
        status: agendamento.status === "PENDENTE" ? "CANCELADO" : "ENCERRADO",
        motivo,
        usuarioId: usuario.id,
        observacao: observacao ? `${motivo}: ${observacao}` : undefined,
      },
      tx,
    );
  });
}
