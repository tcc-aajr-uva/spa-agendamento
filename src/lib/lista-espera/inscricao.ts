import "server-only";
import type { Perfil } from "@/generated/prisma/client";
import { podeAcessar } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import type { Transacao } from "@/lib/transacao";

export const PERFIS_QUE_AGENDAM: Perfil[] = ["ADMINISTRADOR", "ESTAGIARIO"];
export const PERFIS_QUE_DESIGNAM: Perfil[] = ["ADMINISTRADOR", "SUPERVISOR"];
export const PERFIS_QUE_REMOVEM: Perfil[] = ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR", "ESTAGIARIO"];

export async function carregarInscricaoAguardando(tx: Transacao, listaEsperaId: string, usuario: ContextoAutorizacao, perfis: Perfil[]) {
  if (!perfis.includes(usuario.perfil)) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar a lista de espera.");

  const inscricao = await tx.listaEspera.findFirst({
    where: { id: listaEsperaId, status: "AGUARDANDO" },
    select: { id: true, unidadeId: true, equipeId: true, estagiarioId: true, pacienteId: true },
  });
  if (!inscricao) throw new ErroDeRegra("NAO_ENCONTRADO", "Inscrição não encontrada ou já chamada.");
  if (!podeAcessar(usuario, inscricao)) throw new ErroDeRegra("SEM_PERMISSAO", "Você não pode alterar esta inscrição.");
  return inscricao;
}
