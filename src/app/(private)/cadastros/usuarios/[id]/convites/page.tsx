import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarConvitesDoUsuario } from "@/lib/usuario/consultar-convites-usuario";
import { rotuloDoEstadoAcesso, rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { perfisDaRota } from "../../../../menu";
import { gerenciarConvite } from "../../actions";
import { AcoesConvite } from "./acoes-convite";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ConvitesUsuarioPage({ params }: Props) {
  return (
    <section className="space-y-6">
      <Link className="underline" href="/cadastros/usuarios">
        Voltar para usuários
      </Link>
      <Suspense fallback={<p>Carregando convite…</p>}>
        <ConteudoConvites params={params} />
      </Suspense>
    </section>
  );
}

async function ConteudoConvites({ params }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const { id } = await params;
  const usuario = await consultarConvitesDoUsuario(id, autor);
  if (!usuario) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Gerenciar convite</h1>
        <p>{usuario.nome}</p>
        <p className="text-sm text-gray-600">{usuario.email}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border px-2 py-0.5 text-sm">{rotuloDoPerfil(usuario.perfil)}</span>
          <span className="rounded border px-2 py-0.5 text-sm">{rotuloDoEstadoAcesso(usuario.estadoAcesso)}</span>
        </div>
      </div>

      <div className="space-y-3 rounded border p-4">
        {usuario.estadoAcesso === "ATIVO" ? (
          <p>Este usuário já definiu a senha e possui acesso ao sistema.</p>
        ) : usuario.estadoAcesso === "INATIVO" ? (
          <p>Ative o usuário antes de gerar um convite.</p>
        ) : (
          <AcoesConvite acao={gerenciarConvite.bind(null, usuario.id)} estadoAcesso={usuario.estadoAcesso} />
        )}
      </div>
    </div>
  );
}
