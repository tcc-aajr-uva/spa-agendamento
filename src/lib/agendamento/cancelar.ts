import "server-only";
import { timingSafeEqual } from "node:crypto";
import { ErroDeRegra } from "@/lib/erros";
import { hashToken } from "@/lib/token";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import { liberarAgendamento } from "./liberar-agendamento";
import type { Prisma, StatusAgendamento } from "@/generated/prisma/client";

const STATUS_CANCELAVEIS: ReadonlySet<StatusAgendamento> = new Set<StatusAgendamento>(["PENDENTE", "CONFIRMADO"]);

const SELECAO_TOKEN = {
  id: true,
  codigo: true,
  tipo: true,
  expiraEm: true,
  usadoEm: true,
  agendamento: { select: { id: true, status: true } },
} satisfies Prisma.TokenAcessoSelect;

type RegistroToken = Prisma.TokenAcessoGetPayload<{ select: typeof SELECAO_TOKEN }>;

function codigosIguais(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function cancelarPorToken(token: string, codigo: string): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const registro = await tx.tokenAcesso.findUnique({ where: { tokenHash: hashToken(token) }, select: SELECAO_TOKEN });
    await cancelarComToken(tx, registro, codigo, {
      invalido: "Link ou código inválido, já usado ou expirado.",
      observacao: "Cancelado pelo link do paciente",
    });
  });
}

export async function cancelarPorCpf(cpf: string, codigo: string): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const registro = await tx.tokenAcesso.findFirst({
      where: { tipo: "CANCELAMENTO", agendamento: { pacienteAtivo: { cpf } } },
      orderBy: { criadoEm: "desc" },
      select: SELECAO_TOKEN,
    });
    await cancelarComToken(tx, registro, codigo, {
      invalido: "CPF ou código inválido, ou o agendamento já foi cancelado.",
      observacao: "Cancelado pelo paciente com CPF e código",
    });
  });
}

type Textos = { invalido: string; observacao: string };

async function cancelarComToken(tx: Transacao, registro: RegistroToken | null, codigo: string, textos: Textos): Promise<void> {
  const invalido = new ErroDeRegra("NAO_ENCONTRADO", textos.invalido);

  if (
    !registro ||
    registro.tipo !== "CANCELAMENTO" ||
    registro.usadoEm !== null ||
    registro.expiraEm <= new Date() ||
    !codigosIguais(registro.codigo, codigo)
  ) {
    throw invalido;
  }

  if (!STATUS_CANCELAVEIS.has(registro.agendamento.status)) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Este agendamento não pode mais ser cancelado por aqui. Procure a secretaria.");
  }

  const { count } = await tx.tokenAcesso.updateMany({
    where: { id: registro.id, usadoEm: null },
    data: { usadoEm: new Date() },
  });
  if (count === 0) throw invalido;

  await liberarAgendamento(
    registro.agendamento.id,
    { status: "CANCELADO", motivo: "CANCELADO_PELO_PACIENTE", observacao: textos.observacao },
    tx,
  );
}
