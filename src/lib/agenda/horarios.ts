import "server-only";
import { z } from "zod";
import { DIAS_DA_SEMANA, DIAS_EXIBIDOS, formatarHora } from "@/lib/agendamento/regras";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao } from "@/lib/transacao";

const preferenciaSchema = z
  .string()
  .regex(/^\d:(MANHA|TARDE)$/, "Preferência inválida.")
  .transform((valor) => {
    const [dia, turno] = valor.split(":");
    return { diaSemana: Number(dia), turno: turno as "MANHA" | "TARDE" };
  })
  .refine((preferencia) => DIAS_EXIBIDOS.includes(preferencia.diaSemana), "Dia inválido.");

export function descreverHorario(diaSemana: number, horaInicio: number): string {
  return `${DIAS_DA_SEMANA[diaSemana]} ${formatarHora(horaInicio)}`;
}

export function unidadeDaAgenda(usuario: ContextoAutorizacao): string | null {
  return usuario.unidades[0] ?? null;
}

export async function salvarPreferencias(usuario: ContextoAutorizacao, valores: string[]): Promise<number> {
  const dados = z.array(preferenciaSchema).safeParse(valores);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");
  const preferencias = [...new Map(dados.data.map((preferencia) => [`${preferencia.diaSemana}:${preferencia.turno}`, preferencia])).values()];

  await executarEmTransacao(async (tx) => {
    await tx.preferenciaEstagiario.deleteMany({ where: { estagiarioId: usuario.id } });
    await tx.preferenciaEstagiario.createMany({
      data: preferencias.map((preferencia) => ({ estagiarioId: usuario.id, ...preferencia })),
    });
  });
  return preferencias.length;
}
