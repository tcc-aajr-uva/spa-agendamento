import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";

export type ConsultaListaEspera = {
  equipeId?: string;
  pagina: number;
  tamanho: number;
};

const DADOS_DA_INSCRICAO = {
  id: true,
  inscritoEm: true,
  estagiario: { select: { nome: true } },
  paciente: { select: { nome: true, telefone: true, email: true, dataNascimento: true, responsavelNome: true } },
} satisfies Prisma.ListaEsperaSelect;

export async function listarListaEspera(usuario: ContextoAutorizacao, { equipeId, pagina, tamanho }: ConsultaListaEspera) {
  const equipes = await prisma.equipe.findMany({
    where: { ...filtroDeEquipes(usuario), ativa: true },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, unidadeId: true, unidade: { select: { nome: true } } },
  });
  const equipe = equipes.find((candidata) => candidata.id === equipeId) ?? equipes[0];
  if (!equipe) return { equipes, equipe: null, inscricoes: [], total: 0 };

  const where: Prisma.ListaEsperaWhereInput = {
    equipeId: equipe.id,
    status: "AGUARDANDO",
    ...(usuario.perfil === "ESTAGIARIO" ? { estagiarioId: usuario.id } : {}),
  };
  const [inscricoes, total] = await Promise.all([
    prisma.listaEspera.findMany({
      where,
      orderBy: [{ inscritoEm: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * tamanho,
      take: tamanho,
      select: DADOS_DA_INSCRICAO,
    }),
    prisma.listaEspera.count({ where }),
  ]);

  return {
    equipes,
    equipe,
    total,
    inscricoes: inscricoes.map((inscricao, indice) => ({ ...inscricao, posicao: (pagina - 1) * tamanho + indice + 1 })),
  };
}

function filtroDeEquipes(usuario: ContextoAutorizacao): Prisma.EquipeWhereInput {
  if (usuario.perfil === "ESTAGIARIO") return { id: { in: usuario.equipes } };
  if (usuario.perfil === "SUPERVISOR") return { supervisorId: usuario.id };
  return filtroDeUnidades(usuario);
}
