"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { prisma } from "@/lib/prisma";
import { ErroDeRegra } from "@/lib/erros";
import { alterarSituacaoDaSala } from "@/lib/salas/situacao-sala";
import { violouUnicidade } from "@/lib/transacao";
import { perfisDaRota } from "../menu";

export type EstadoSala = { erro?: string; mensagem?: string };

const novaSalaSchema = z.object({
  unidadeId: z.string().min(1, "Escolha a unidade."),
  nome: z.string().trim().min(1, "Informe o nome da sala.").max(60, "Use no máximo 60 caracteres."),
});

export async function criarSala(_estado: EstadoSala, formData: FormData): Promise<EstadoSala> {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  const dados = novaSalaSchema.safeParse({
    unidadeId: texto(formData, "unidadeId"),
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
  try {
    await alterarSituacaoDaSala(usuario, texto(formData, "salaId"), texto(formData, "ativar") === "true");
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
  refresh();
  return {};
}

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}
