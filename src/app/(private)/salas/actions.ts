"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { filtroAgendamentoAtivo } from "@/lib/agendamento/regras";
import { exigirUsuario, podeAcessar } from "@/lib/auth/permissao";
import { prisma } from "@/lib/prisma";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";
import { perfisDaRota } from "../menu";

export type EstadoSala = { erro?: string; mensagem?: string };

const novaSalaSchema = z.object({
  unidadeId: z.string().min(1, "Escolha a unidade."),
  nome: z.string().trim().min(1, "Informe o nome da sala.").max(60, "Use no máximo 60 caracteres."),
});

export async function criarSala(_estado: EstadoSala, formData: FormData): Promise<EstadoSala> {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  const dados = novaSalaSchema.safeParse({
    unidadeId: usuario.unidadeId ?? texto(formData, "unidadeId"),
    nome: texto(formData, "nome"),
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };
  if (!podeAcessar(usuario, { unidadeId: dados.data.unidadeId })) return { erro: "Você não tem acesso a essa unidade." };

  try {
    await prisma.sala.create({ data: dados.data });
  } catch (erro) {
    if (violouUnicidade(erro)) return { erro: `Já existe uma sala chamada "${dados.data.nome}" nesta unidade.` };
    throw erro;
  }
  refresh();
  return { mensagem: `Sala "${dados.data.nome}" cadastrada.` };
}

export async function alterarSituacaoSala(_estado: EstadoSala, formData: FormData): Promise<EstadoSala> {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  // O formulário manda o estado desejado, para dois cliques simultâneos não se anularem.
  const ativar = texto(formData, "ativar") === "true";

  const erro = await executarEmTransacao(async (tx) => {
    const sala = await tx.sala.findUnique({ where: { id: texto(formData, "salaId") }, select: { id: true, nome: true, unidadeId: true } });
    if (!sala || !podeAcessar(usuario, { unidadeId: sala.unidadeId })) return "Sala não encontrada.";

    if (!ativar) {
      // Na mesma transação Serializable do criarAgendamento: um agendamento novo nesta sala não escapa da contagem.
      const ativos = await tx.agendamento.count({ where: { salaId: sala.id, ...filtroAgendamentoAtivo(new Date()) } });
      if (ativos > 0) return `A ${sala.nome} tem ${ativos} agendamento(s) ativo(s). Cancele ou encerre antes de desativar.`;
    }
    await tx.sala.update({ where: { id: sala.id }, data: { ativa: ativar } });
    return null;
  });

  if (erro) return { erro };
  refresh();
  return {};
}

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}
