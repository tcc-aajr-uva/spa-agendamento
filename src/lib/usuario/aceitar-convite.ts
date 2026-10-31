import "server-only";

import { z } from "zod";

import { gerarHashDaSenha, senhaExcedeLimiteBcrypt } from "@/lib/auth/password";
import { ErroDeRegra } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { hashToken, tokenTemFormatoValido } from "@/lib/token";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";

const aceiteConviteSchema = z
  .object({
    token: z
      .string()
      .trim()
      .refine(tokenTemFormatoValido, "Este convite é inválido ou não está mais disponível."),
    senha: z
      .string()
      .min(8, "A senha deve possuir ao menos 8 caracteres.")
      .refine((senha) => !senhaExcedeLimiteBcrypt(senha), "A senha deve possuir no máximo 72 bytes."),
    confirmacaoSenha: z.string(),
  })
  .refine(({ senha, confirmacaoSenha }) => senha === confirmacaoSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmacaoSenha"],
  });

export async function aceitarConvite(
  entrada: { token: string; senha: string; confirmacaoSenha: string },
  agora?: Date,
): Promise<void> {
  const resultado = aceiteConviteSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const tokenHash = hashToken(resultado.data.token);
  const instanteConsulta = agora ?? new Date();
  const conviteDisponivel = await prisma.convite.findUnique({
    where: { tokenHash },
    select: {
      expiraEm: true,
      usadoEm: true,
      revogadoEm: true,
      usuario: { select: { ativo: true } },
    },
  });
  if (
    !conviteDisponivel ||
    !conviteDisponivel.usuario.ativo ||
    conviteDisponivel.usadoEm !== null ||
    conviteDisponivel.revogadoEm !== null ||
    conviteDisponivel.expiraEm <= instanteConsulta
  ) {
    conviteInvalido();
  }

  const senhaHash = await gerarHashDaSenha(resultado.data.senha);
  const instanteConsumo = agora ?? new Date();

  try {
    await executarEmTransacao(async (tx) => {
      const convite = await tx.convite.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          expiraEm: true,
          usadoEm: true,
          revogadoEm: true,
          usuario: { select: { id: true, ativo: true } },
        },
      });

      if (
        !convite ||
        !convite.usuario.ativo ||
        convite.usadoEm !== null ||
        convite.revogadoEm !== null ||
        convite.expiraEm <= instanteConsumo
      ) {
        conviteInvalido();
      }

      const contaExistente = await tx.contaAutenticacao.findUnique({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: convite.usuario.id,
          },
        },
        select: { id: true },
      });
      if (contaExistente) conviteInvalido();

      const uso = await tx.convite.updateMany({
        where: {
          id: convite.id,
          usadoEm: null,
          revogadoEm: null,
          expiraEm: { gt: instanteConsumo },
        },
        data: { usadoEm: instanteConsumo },
      });
      if (uso.count !== 1) conviteInvalido();

      await tx.contaAutenticacao.create({
        data: {
          accountId: convite.usuario.id,
          providerId: "credential",
          userId: convite.usuario.id,
          password: senhaHash,
        },
      });

      await tx.usuario.update({
        where: { id: convite.usuario.id },
        data: { emailVerificado: true },
      });
    });
  } catch (erro) {
    if (violouUnicidade(erro)) conviteInvalido();
    throw erro;
  }
}

function conviteInvalido(): never {
  throw new ErroDeRegra("CONVITE_INVALIDO", "Este convite é inválido ou não está mais disponível.");
}
