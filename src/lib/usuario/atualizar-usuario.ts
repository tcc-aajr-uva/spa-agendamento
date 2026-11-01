import "server-only";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { executarEmTransacao, type Transacao } from "@/lib/transacao";
import {
  atualizacaoUsuarioSchema,
  perfisCriaveisSchema,
  type AtualizacaoUsuario,
} from "@/lib/usuario/dados-usuario";
import { filtroDeUsuariosGerenciaveis } from "@/lib/usuario/escopo-usuario";
import {
  atribuirSupervisor,
  resolverVinculos,
  validarFormatoDosVinculos,
} from "@/lib/usuario/vinculos-usuario";

export async function atualizarUsuarioGerenciavel(
  usuarioId: string,
  entrada: AtualizacaoUsuario,
  autor: ContextoAutorizacao,
): Promise<void> {
  const resultado = atualizacaoUsuarioSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new ErroDeRegra("DADOS_INVALIDOS", resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }

  await executarEmTransacao(async (tx) => {
    const usuario = await tx.usuario.findFirst({
      where: { id: usuarioId, ...filtroDeUsuariosGerenciaveis(autor) },
      select: { perfil: true, ativo: true },
    });
    if (!usuario) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar este usuário.");
    }

    const perfil = perfisCriaveisSchema.safeParse(usuario.perfil);
    if (!perfil.success) {
      throw new ErroDeRegra("SEM_PERMISSAO", "Este perfil não pode ser alterado por esta tela.");
    }

    const dados = resultado.data;
    validarFormatoDosVinculos(perfil.data, dados.unidadeIds, dados.equipeIds);
    const vinculos = await resolverVinculos(
      tx,
      perfil.data,
      dados.unidadeIds,
      dados.equipeIds,
      autor,
      usuarioId,
    );

    await tx.usuario.update({ where: { id: usuarioId }, data: { nome: dados.nome } });
    await sincronizarUnidades(tx, usuarioId, vinculos.unidadeIds);
    await sincronizarEquipes(tx, usuarioId, perfil.data, usuario.ativo, vinculos.equipes);
  });
}

async function sincronizarUnidades(
  tx: Transacao,
  usuarioId: string,
  unidadeIds: string[],
) {
  await tx.usuarioUnidade.updateMany({
    where: { usuarioId, unidadeId: { notIn: unidadeIds } },
    data: { ativo: false },
  });
  for (const unidadeId of unidadeIds) {
    await tx.usuarioUnidade.upsert({
      where: { usuarioId_unidadeId: { usuarioId, unidadeId } },
      create: { usuarioId, unidadeId },
      update: { ativo: true },
    });
  }
}

async function sincronizarEquipes(
  tx: Transacao,
  usuarioId: string,
  perfil: "COORDENACAO" | "SECRETARIA" | "SUPERVISOR" | "ESTAGIARIO",
  usuarioAtivo: boolean,
  equipes: { id: string; unidadeId: string }[],
) {
  const equipeIds = equipes.map(({ id }) => id);
  await tx.usuarioEquipe.updateMany({
    where: { usuarioId, equipeId: { notIn: equipeIds } },
    data: { ativo: false },
  });

  if (perfil === "SUPERVISOR") {
    await tx.equipe.updateMany({
      where: { supervisorId: usuarioId, id: { notIn: equipeIds } },
      data: { supervisorId: null },
    });
  }

  for (const equipe of equipes) {
    await tx.usuarioEquipe.upsert({
      where: { usuarioId_equipeId: { usuarioId, equipeId: equipe.id } },
      create: { usuarioId, equipeId: equipe.id, unidadeId: equipe.unidadeId },
      update: { unidadeId: equipe.unidadeId, ativo: true },
    });

    if (perfil === "SUPERVISOR" && usuarioAtivo) {
      await atribuirSupervisor(tx, equipe.id, usuarioId);
    }
  }
}
