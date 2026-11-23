import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";
import { aprovacaoSolicitacaoSchema, type AprovacaoSolicitacao } from "@/lib/solicitacao-acesso/dados-solicitacao";
import {
  exigirSolicitacaoPendente,
  registrarDecisao,
  validarIdDaSolicitacao,
} from "@/lib/solicitacao-acesso/decisao-solicitacao";
import { criarUsuarioNaTransacao, type UsuarioComConviteCriado } from "@/lib/usuario/criar-usuario";

export async function aprovarSolicitacao(
  id: string,
  entrada: AprovacaoSolicitacao,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<UsuarioComConviteCriado> {
  validarIdDaSolicitacao(id);
  const resultado = aprovacaoSolicitacaoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    return await executarEmTransacao(async (tx) => {
      const solicitacao = await exigirSolicitacaoPendente(tx, id, autor);
      const criado = await criarUsuarioNaTransacao(tx, {
        ...solicitacao,
        perfil: "ESTAGIARIO",
        ...resultado.data,
      }, autor, agora);
      await registrarDecisao(tx, id, {
        status: "APROVADA",
        usuarioId: criado.usuarioId,
        unidadeId: resultado.data.unidadeIds[0],
      }, autor, agora);
      return criado;
    });
  } catch (erro) {
    if (violouUnicidade(erro, "email")) {
      throw new ErroDeRegra("EMAIL_EM_USO", "Este e-mail já pertence a um usuário. Recuse a solicitação.");
    }
    throw erro;
  }
}
