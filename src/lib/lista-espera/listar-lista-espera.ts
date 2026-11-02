import "server-only";
import { filtroDeUnidades } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";

export type ConsultaListaEspera = {
  equipeId?: string;
  pagina: number;
  tamanho: number;
};

export async function listarListaEspera(usuario: ContextoAutorizacao, { equipeId, pagina, tamanho }: ConsultaListaEspera) {
  const equipes = await prisma.equipe.findMany({
    where: usuario.perfil === "ESTAGIARIO" ? { id: { in: usuario.equipes }, ativa: true } : { ...filtroDeUnidades(usuario), ativa: true },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, unidade: { select: { nome: true } } },
  });
  const equipe = equipes.find((candidata) => candidata.id === equipeId) ?? equipes[0];
  if (!equipe) return { equipes, equipe: null, inscricoes: [], total: 0 };

  const where = { equipeId: equipe.id, status: "AGUARDANDO" as const };
  const [inscricoes, total] = await Promise.all([
    prisma.listaEspera.findMany({
      where,
      orderBy: [{ inscritoEm: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * tamanho,
      take: tamanho,
      select: { id: true, inscritoEm: true, paciente: { select: { nome: true, telefone: true } } },
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
