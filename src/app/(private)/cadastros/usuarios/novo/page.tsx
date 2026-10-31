import { Suspense } from "react";
import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { perfisCriadosPor, type PerfilCriavel } from "@/lib/usuario/hierarquia";
import { perfisDaRota } from "../../../menu";
import { criarUsuario } from "../actions";
import { FormularioUsuario } from "../formulario-usuario";

export default function NovoUsuarioPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link className="underline" href="/cadastros/usuarios">
          Voltar para usuários
        </Link>
        <h1 className="text-2xl font-bold">Novo usuário</h1>
        <p className="text-sm text-gray-600">Cadastre a pessoa e gere o link para definição da senha.</p>
      </div>

      <Suspense fallback={<p>Carregando formulário…</p>}>
        <NovoUsuario />
      </Suspense>
    </section>
  );
}

async function NovoUsuario() {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const perfis = perfisCriadosPor(autor.perfil);
  if (perfis.length === 0) return null;

  const configuracoes = await Promise.all(
    perfis.map(async (perfil) => ({
      perfil,
      tipoVinculo: perfil === "COORDENACAO" || perfil === "SECRETARIA" ? ("unidadeIds" as const) : ("equipeIds" as const),
      opcoes: await listarOpcoesDeVinculo(autor, perfil),
    })),
  );

  return <FormularioUsuario acao={criarUsuario} configuracoes={configuracoes} />;
}

async function listarOpcoesDeVinculo(autor: ContextoAutorizacao, perfil: PerfilCriavel) {
  if (perfil === "COORDENACAO" || perfil === "SECRETARIA") {
    return prisma.unidade.findMany({
      where: {
        ativa: true,
        ...(autor.perfil !== "ADMINISTRADOR" ? { id: { in: autor.unidades } } : {}),
      },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
  }

  const whereDeEscopo: Prisma.EquipeWhereInput =
    autor.perfil === "ADMINISTRADOR"
      ? {}
      : autor.perfil === "COORDENACAO" || autor.perfil === "SECRETARIA"
        ? { unidadeId: { in: autor.unidades } }
        : { id: { in: autor.equipes }, supervisorId: autor.id };

  const equipes = await prisma.equipe.findMany({
    where: {
      ativa: true,
      unidade: { ativa: true },
      ...whereDeEscopo,
      ...(perfil === "SUPERVISOR" ? { supervisorId: null } : {}),
      ...(perfil === "ESTAGIARIO" && (autor.perfil === "ADMINISTRADOR" || autor.perfil === "COORDENACAO")
        ? { supervisorId: { not: null } }
        : {}),
    },
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    select: { id: true, nome: true, unidade: { select: { nome: true } } },
  });
  return equipes.map((equipe) => ({ id: equipe.id, nome: `${equipe.unidade.nome} — ${equipe.nome}` }));
}
