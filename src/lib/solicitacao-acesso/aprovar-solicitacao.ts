import "server-only";

import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";
import {
  aprovacaoSolicitacaoSchema,
  solicitacaoIdSchema,
  type AprovacaoSolicitacao,
} from "@/lib/solicitacao-acesso/dados-solicitacao";
import { criarUsuarioNaTransacao, type UsuarioComConviteCriado } from "@/lib/usuario/criar-usuario";

export async function aprovarSolicitacao(
  id: string,
  entrada: AprovacaoSolicitacao,
  autor: ContextoAutorizacao,
  agora = new Date(),
): Promise<UsuarioComConviteCriado> {
  if (!solicitacaoIdSchema.safeParse(id).success) {
    throw new ErroDeRegra("NAO_ENCONTRADO", "Solicitação não encontrada.");
  }
  const resultado = aprovacaoSolicitacaoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    return await executarEmTransacao(async (tx) => {
      const solicitacao = await tx.solicitacaoAcesso.findFirst({
        where: { id, ...filtroDeUnidades(autor) },
        select: { nome: true, email: true, status: true },
      });
      if (!solicitacao) throw new ErroDeRegra("NAO_ENCONTRADO", "Solicitação não encontrada.");
      if (solicitacao.status !== "PENDENTE") {
        throw new ErroDeRegra("STATUS_INVALIDO", "Esta solicitação já foi analisada.");
      }

      const criado = await criarUsuarioNaTransacao(tx, {
        nome: solicitacao.nome,
        email: solicitacao.email,
        perfil: "ESTAGIARIO",
        ...resultado.data,
      }, autor, agora);

      const decisao = await tx.solicitacaoAcesso.updateMany({
        where: { id, status: "PENDENTE" },
        data: {
          status: "APROVADA",
          emailPendente: null,
          decididoPorId: autor.id,
          decididoEm: agora,
          usuarioId: criado.usuarioId,
        },
      });
      if (decisao.count !== 1) {
        throw new ErroDeRegra("STATUS_INVALIDO", "Esta solicitação já foi analisada.");
      }

      return criado;
    });
  } catch (erro) {
    if (violouUnicidade(erro, "email")) {
      throw new ErroDeRegra("EMAIL_EM_USO", "Este e-mail já pertence a um usuário. Recuse a solicitação.");
    }
    throw erro;
  }
}
