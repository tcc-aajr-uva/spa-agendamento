import "server-only";

import type { Perfil, Prisma } from "@/generated/prisma/client";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { gerarToken, hashToken } from "@/lib/token";
import { executarEmTransacao, type Transacao, violouUnicidade } from "@/lib/transacao";
import { novoUsuarioSchema, type NovoUsuario } from "@/lib/usuario/dados-usuario";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";

const DURACAO_CONVITE_MS = 24 * 60 * 60 * 1000;

export type UsuarioComConviteCriado = {
  usuarioId: string;
  linkConvite: string;
  expiraEm: Date;
};

export async function criarUsuarioComConvite(
  entrada: NovoUsuario,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<UsuarioComConviteCriado> {
  const resultado = novoUsuarioSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const dados = resultado.data;
  if (!perfisCriadosPor(autor.perfil).includes(dados.perfil)) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Seu perfil não pode criar este tipo de usuário.");
  }

  validarFormatoDosVinculos(dados.perfil, dados.unidadeIds, dados.equipeIds);

  const token = gerarToken();
  const tokenHash = hashToken(token);
  const expiraEm = new Date(agora.getTime() + DURACAO_CONVITE_MS);

  try {
    return await executarEmTransacao(async (tx) => {
      const vinculos = await resolverVinculos(tx, dados.perfil, dados.unidadeIds, dados.equipeIds, autor);

      const usuario = await tx.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          perfil: dados.perfil,
        },
        select: { id: true },
      });

      await tx.usuarioUnidade.createMany({
        data: vinculos.unidadeIds.map((unidadeId) => ({ usuarioId: usuario.id, unidadeId })),
      });

      if (vinculos.equipes.length > 0) {
        await tx.usuarioEquipe.createMany({
          data: vinculos.equipes.map(({ id: equipeId, unidadeId }) => ({
            usuarioId: usuario.id,
            equipeId,
            unidadeId,
          })),
        });
      }

      if (dados.perfil === "SUPERVISOR") {
        for (const equipe of vinculos.equipes) {
          const atualizacao = await tx.equipe.updateMany({
            where: { id: equipe.id, supervisorId: null },
            data: { supervisorId: usuario.id },
          });
          if (atualizacao.count !== 1) {
            throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
          }
        }
      }

      await tx.convite.create({
        data: {
          usuarioId: usuario.id,
          tokenHash,
          expiraEm,
        },
      });

      return {
        usuarioId: usuario.id,
        linkConvite: `/convite/${token}`,
        expiraEm,
      };
    });
  } catch (erro) {
    if (violouUnicidade(erro, "email")) {
      throw new ErroDeRegra("EMAIL_EM_USO", "Este e-mail já pertence a outro usuário.");
    }
    throw erro;
  }
}

function validarFormatoDosVinculos(perfil: Perfil, unidadeIds: string[], equipeIds: string[]) {
  const perfilPorUnidade = perfil === "COORDENACAO" || perfil === "SECRETARIA";
  if (perfilPorUnidade && (unidadeIds.length === 0 || equipeIds.length > 0)) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Informe ao menos uma unidade e nenhuma equipe para este perfil.");
  }
  if (!perfilPorUnidade && (equipeIds.length === 0 || unidadeIds.length > 0)) {
    throw new ErroDeRegra("DADOS_INVALIDOS", "Informe ao menos uma equipe; as unidades serão definidas pelas equipes.");
  }
}

async function resolverVinculos(
  tx: Transacao,
  perfil: Perfil,
  unidadeIds: string[],
  equipeIds: string[],
  autor: ContextoAutorizacao,
) {
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    if (autor.perfil !== "ADMINISTRADOR" && unidadeIds.some((id) => !autor.unidades.includes(id))) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode vincular usuários fora das suas unidades.");
    }

    const unidades = await tx.unidade.findMany({
      where: { id: { in: unidadeIds }, ativa: true },
      select: { id: true },
    });
    if (unidades.length !== unidadeIds.length) {
      throw new ErroDeRegra("DADOS_INVALIDOS", "Uma das unidades não existe ou está inativa.");
    }
    return { unidadeIds, equipes: [] as { id: string; unidadeId: string }[] };
  }

  const whereDeEscopo: Prisma.EquipeWhereInput =
    autor.perfil === "ADMINISTRADOR"
      ? {}
      : autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA"
        ? { unidadeId: { in: autor.unidades } }
        : { id: { in: autor.equipes }, supervisorId: autor.id };

  const exigeSupervisorResponsavel =
    perfil === "ESTAGIARIO" && (autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO");

  const equipes = await tx.equipe.findMany({
    where: {
      id: { in: equipeIds },
      ativa: true,
      unidade: { ativa: true },
      ...whereDeEscopo,
      ...(exigeSupervisorResponsavel ? { supervisorId: { not: null } } : {}),
    },
    select: { id: true, unidadeId: true, supervisorId: true },
  });

  if (equipes.length !== equipeIds.length) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Uma das equipes não pertence ao seu escopo ou está inativa.");
  }
  if (perfil === "SUPERVISOR" && equipes.some(({ supervisorId }) => supervisorId !== null)) {
    throw new ErroDeRegra("EQUIPE_COM_SUPERVISOR", "Uma das equipes já possui supervisor responsável.");
  }

  return {
    unidadeIds: [...new Set(equipes.map(({ unidadeId }) => unidadeId))],
    equipes: equipes.map(({ id, unidadeId }) => ({ id, unidadeId })),
  };
}
