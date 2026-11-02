import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import { gerarDadosConvite } from "@/lib/usuario/dados-convite";
import { filtroDeUsuariosGerenciaveis } from "@/lib/usuario/escopo-usuario";

export type NovoConviteGerado = {
  linkConvite: string;
  expiraEm: Date;
};

export async function gerarNovoConvite(
  usuarioId: string,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<NovoConviteGerado> {
  const dadosConvite = gerarDadosConvite(agora);

  return executarEmTransacao(async (tx) => {
    const usuario = await obterUsuarioGerenciavel(tx, usuarioId, autor);
    if (!usuario.ativo) {
      throw new ErroDeRegra("DADOS_INVALIDOS", "Ative o usuário antes de gerar um convite.");
    }
    if (usuario.accounts.length > 0) {
      throw new ErroDeRegra("DADOS_INVALIDOS", "Este usuário já definiu a senha de acesso.");
    }

    await tx.convite.updateMany({
      where: { usuarioId, usadoEm: null, revogadoEm: null },
      data: { revogadoEm: agora },
    });
    await tx.convite.create({
      data: {
        usuarioId,
        tokenHash: dadosConvite.tokenHash,
        expiraEm: dadosConvite.expiraEm,
      },
    });

    return {
      linkConvite: `/convite/${dadosConvite.token}`,
      expiraEm: dadosConvite.expiraEm,
    };
  });
}

export async function revogarConvite(usuarioId: string, autor: ContextoAutorizacao, agora = new Date()): Promise<void> {
  await executarEmTransacao(async (tx) => {
    const usuario = await obterUsuarioGerenciavel(tx, usuarioId, autor);
    if (usuario.accounts.length > 0) {
      throw new ErroDeRegra("DADOS_INVALIDOS", "Este usuário já definiu a senha de acesso.");
    }

    const resultado = await tx.convite.updateMany({
      where: { usuarioId, usadoEm: null, revogadoEm: null, expiraEm: { gt: agora } },
      data: { revogadoEm: agora },
    });
    if (resultado.count === 0) {
      throw new ErroDeRegra("CONVITE_INVALIDO", "Não há convite pendente para revogar.");
    }
  });
}

async function obterUsuarioGerenciavel(
  tx: Transacao,
  usuarioId: string,
  autor: ContextoAutorizacao,
) {
  const usuario = await tx.usuario.findFirst({
    where: { id: usuarioId, ...filtroDeUsuariosGerenciaveis(autor) },
    select: {
      ativo: true,
      accounts: {
        where: { providerId: "credential" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!usuario) {
    throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode gerenciar os convites deste usuário.");
  }
  return usuario;
}
