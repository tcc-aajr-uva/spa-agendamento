import "server-only";
import { z } from "zod";
import { horarioNaGrade, type Grade } from "@/lib/agendamento/regras";
import { podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";

const diasSchema = z.array(z.coerce.number().int().min(0).max(6)).min(1, "Escolha pelo menos um dia.");
const horaSchema = z.coerce.number().int().min(0).max(24 * 60);

const novaDisponibilidadeSchema = z.discriminatedUnion("modo", [
  z.object({ modo: z.literal("INTERVALO"), salaId: z.string().min(1), dias: diasSchema, horaInicio: horaSchema, horaFim: horaSchema }),
  z.object({
    modo: z.literal("HORARIOS"),
    salaId: z.string().min(1),
    dias: diasSchema,
    horarios: z.array(horaSchema).min(1, "Escolha pelo menos um horário."),
  }),
]);

export async function adicionarDisponibilidade(usuario: ContextoAutorizacao, entrada: unknown): Promise<number> {
  const dados = novaDisponibilidadeSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");

  const sala = await prisma.sala.findUnique({
    where: { id: dados.data.salaId },
    select: { id: true, unidadeId: true, unidade: { select: { horaAbertura: true, horaFechamento: true, duracaoBlocoMin: true } } },
  });
  if (!sala || !podeAcessar(usuario, { unidadeId: sala.unidadeId })) throw new ErroDeRegra("NAO_ENCONTRADO", "Sala não encontrada.");

  const faixas = faixasDoPedido(dados.data, sala.unidade);
  const dias = [...new Set(dados.data.dias)];
  const { count } = await prisma.salaDisponibilidade.createMany({
    data: dias.flatMap((diaSemana) => faixas.map((faixa) => ({ salaId: sala.id, diaSemana, ...faixa }))),
  });
  return count;
}

export async function removerDisponibilidade(usuario: ContextoAutorizacao, disponibilidadeId: string): Promise<void> {
  const disponibilidade = await prisma.salaDisponibilidade.findUnique({
    where: { id: disponibilidadeId },
    select: { id: true, sala: { select: { unidadeId: true } } },
  });
  if (!disponibilidade || !podeAcessar(usuario, { unidadeId: disponibilidade.sala.unidadeId })) {
    throw new ErroDeRegra("NAO_ENCONTRADO", "Disponibilidade não encontrada.");
  }
  await prisma.salaDisponibilidade.delete({ where: { id: disponibilidade.id } });
}

function faixasDoPedido(pedido: z.output<typeof novaDisponibilidadeSchema>, grade: Grade): { horaInicio: number; horaFim: number }[] {
  if (pedido.modo === "HORARIOS") {
    const horarios = [...new Set(pedido.horarios)];
    if (horarios.some((hora) => !horarioNaGrade(grade, hora))) throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha horários da grade.");
    return horarios.map((hora) => ({ horaInicio: hora, horaFim: hora + grade.duracaoBlocoMin }));
  }

  const { horaInicio, horaFim } = pedido;
  const fimNaGrade = horaFim <= grade.horaFechamento && (horaFim - grade.horaAbertura) % grade.duracaoBlocoMin === 0;
  if (!horarioNaGrade(grade, horaInicio) || !fimNaGrade || horaFim <= horaInicio) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Escolha um início e um fim da grade, com o fim depois do início.");
  }
  return [{ horaInicio, horaFim }];
}
