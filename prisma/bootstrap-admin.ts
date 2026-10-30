import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { gerarHashDaSenha } from "../src/lib/auth/password";

const variaveisSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL deve ser uma URL válida."),
  BOOTSTRAP_ADMIN_NAME: z.string().trim().min(2, "BOOTSTRAP_ADMIN_NAME deve possuir ao menos 2 caracteres."),
  BOOTSTRAP_ADMIN_EMAIL: z.email("BOOTSTRAP_ADMIN_EMAIL deve ser um e-mail válido.").trim().toLowerCase(),
  BOOTSTRAP_ADMIN_PASSWORD: z
    .string()
    .min(12, "BOOTSTRAP_ADMIN_PASSWORD deve possuir ao menos 12 caracteres.")
    .max(128, "BOOTSTRAP_ADMIN_PASSWORD deve possuir no máximo 128 caracteres."),
});

const resultado = variaveisSchema.safeParse(process.env);

if (!resultado.success) {
  const mensagens = resultado.error.issues.map((erro) => erro.message).join("\n");
  throw new Error(`Configuração inválida para o bootstrap:\n${mensagens}`);
}

const { DATABASE_URL, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD } = resultado.data;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

async function main() {
  const senhaHash = await gerarHashDaSenha(BOOTSTRAP_ADMIN_PASSWORD);

  const usuario = await prisma.$transaction(
    async (tx) => {
      const administradorExistente = await tx.usuario.findFirst({
        where: { perfil: "ADMINISTRADOR" },
        select: { email: true },
      });

      if (administradorExistente) {
        throw new Error(`Já existe um administrador cadastrado: ${administradorExistente.email}`);
      }

      const emailEmUso = await tx.usuario.findUnique({
        where: { email: BOOTSTRAP_ADMIN_EMAIL },
        select: { id: true },
      });

      if (emailEmUso) {
        throw new Error("O e-mail informado já pertence a outro usuário.");
      }

      const administrador = await tx.usuario.create({
        data: {
          nome: BOOTSTRAP_ADMIN_NAME,
          email: BOOTSTRAP_ADMIN_EMAIL,
          emailVerificado: true,
          perfil: "ADMINISTRADOR",
        },
        select: { id: true, email: true },
      });

      await tx.contaAutenticacao.create({
        data: {
          accountId: administrador.id,
          providerId: "credential",
          userId: administrador.id,
          password: senhaHash,
        },
      });

      return administrador;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  console.info(`Administrador criado com sucesso: ${usuario.email}`);
}

main()
  .catch((erro: unknown) => {
    console.error(erro instanceof Error ? erro.message : "Não foi possível criar o administrador.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
