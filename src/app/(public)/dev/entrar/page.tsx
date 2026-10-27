import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { sessaoDeDesenvolvimentoAtiva } from "@/lib/auth/usuario-atual";
import { prisma } from "@/lib/prisma";
import { entrarComo } from "./actions";

export default function EntrarDevPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Entrar como (desenvolvimento)</h1>
      <p className="mb-4 text-sm">Login provisório do esqueleto. Some em produção; o card #1 troca pelo login real.</p>
      <Suspense fallback={<p>Carregando usuários…</p>}>
        <ListaDeUsuarios />
      </Suspense>
    </main>
  );
}

async function ListaDeUsuarios() {
  await connection();
  if (!sessaoDeDesenvolvimentoAtiva()) notFound();

  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    orderBy: [{ perfil: "asc" }, { nome: "asc" }],
    take: 100,
    select: { id: true, nome: true, perfil: true, unidade: { select: { nome: true } }, equipe: { select: { nome: true } } },
  });

  if (usuarios.length === 0) return <p>Nenhum usuário. Rode o seed (npm run db:seed).</p>;

  return (
    <ul className="flex flex-col gap-2">
      {usuarios.map((usuario) => (
        <li key={usuario.id}>
          <form action={entrarComo} className="flex items-center gap-3">
            <input type="hidden" name="usuarioId" value={usuario.id} />
            <button className="rounded border px-3 py-1">Entrar</button>
            <span>
              {usuario.nome} — {usuario.perfil}
              {usuario.unidade ? ` · ${usuario.unidade.nome}` : ""}
              {usuario.equipe ? ` · ${usuario.equipe.nome}` : ""}
            </span>
          </form>
        </li>
      ))}
    </ul>
  );
}
