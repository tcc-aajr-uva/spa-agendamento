import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";
import { gerarDadosConvite } from "@/lib/usuario/dados-convite";
import { novoUsuarioSchema, type NovoUsuario } from "@/lib/usuario/dados-usuario";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";
import {
  atribuirSupervisor,
  resolverVinculos,
  validarFormatoDosVinculos,
} from "@/lib/usuario/vinculos-usuario";

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

  const dadosConvite = gerarDadosConvite(agora);

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
          await atribuirSupervisor(tx, equipe.id, usuario.id);
        }
      }

      await tx.convite.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: dadosConvite.tokenHash,
          expiraEm: dadosConvite.expiraEm,
        },
      });

      return {
        usuarioId: usuario.id,
        linkConvite: `/convite/${dadosConvite.token}`,
        expiraEm: dadosConvite.expiraEm,
      };
    });
  } catch (erro) {
    if (violouUnicidade(erro, "email")) {
      throw new ErroDeRegra("EMAIL_EM_USO", "Este e-mail já pertence a outro usuário.");
    }
    throw erro;
  }
}
