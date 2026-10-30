import "server-only";
import type { Perfil } from "@/generated/prisma/client";
import { podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";

export const PERFIS_DA_LISTA: Perfil[] = ["ADMINISTRADOR", "ESTAGIARIO", "SECRETARIA", "COORDENACAO"];

export async function carregarInscricaoAguardando(tx: Transacao, listaEsperaId: string, usuario: ContextoAutorizacao) {
  if (!PERFIS_DA_LISTA.includes(usuario.perfil)) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar a lista de espera.");

  const inscricao = await tx.listaEspera.findFirst({
    where: { id: listaEsperaId, status: "AGUARDANDO" },
    select: {
      id: true,
      unidadeId: true,
      equipeId: true,
      paciente: {
        select: { nome: true, cpf: true, dataNascimento: true, telefone: true, email: true, responsavelNome: true, responsavelCpf: true },
      },
    },
  });
  if (!inscricao) throw new ErroDeRegra("NAO_ENCONTRADO", "Inscrição não encontrada ou já chamada.");
  if (!podeAcessar(usuario, inscricao)) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar esta inscrição.");
  return inscricao;
}
