import "server-only";

import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";
import {
  gerarHashDaSenha,
  LIMITE_SENHA_BCRYPT_BYTES,
  verificarSenha,
} from "@/lib/auth/password";

const baseURL = process.env.BETTER_AUTH_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (!baseURL) {
  throw new Error("A variável BETTER_AUTH_URL não foi configurada.");
}

if (!secret) {
  throw new Error("A variável BETTER_AUTH_SECRET não foi configurada.");
}

export const auth = betterAuth({
  appName: "SPA Agendamento",
  baseURL,
  secret,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    modelName: "Usuario",

    fields: {
      name: "nome",
      emailVerified: "emailVerificado",
      image: "imagem",
      createdAt: "criadoEm",
      updatedAt: "atualizadoEm",
    },

    additionalFields: {
      perfil: {
        type: [
          "ADMINISTRADOR",
          "COORDENACAO",
          "SECRETARIA",
          "SUPERVISOR",
          "ESTAGIARIO",
        ],
        required: true,
        defaultValue: "ESTAGIARIO",
        input: false,
      },

      ativo: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },

  session: {
    modelName: "SessaoAutenticacao",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  account: {
    modelName: "ContaAutenticacao",
  },

  verification: {
    modelName: "VerificacaoAutenticacao",
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: LIMITE_SENHA_BCRYPT_BYTES,

    password: {
      hash: gerarHashDaSenha,
      verify: verificarSenha,
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
    modelName: "LimiteRequisicao",

    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (sessao) => {
          const usuario = await prisma.usuario.findUnique({
            where: {
              id: sessao.userId,
            },
            select: {
              ativo: true,
            },
          });

          if (!usuario?.ativo) {
            return false;
          }

          return {
            data: sessao,
          };
        },
      },
    },
  },
});
