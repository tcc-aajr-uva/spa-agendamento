import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUsuarioGerenciavel } from "@/lib/usuario/consultar-usuario-gerenciavel";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { rotuloDoEstadoAcesso, rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { perfisDaRota } from "../../../menu";
import { alterarAtivacao, atualizarUsuario } from "./actions";
import { ControleAtivacaoUsuario } from "./controle-ativacao";
import { FormularioEdicaoUsuario } from "./formulario-edicao";

type Props = {
  params: Promise<{ id: string }>;
};

export default function UsuarioPage({ params }: Props) {
  return (
    <section className="space-y-6">
      <Link className="underline" href="/cadastros/usuarios">
        Voltar para usuários
      </Link>
      <Suspense fallback={<p>Carregando usuário…</p>}>
        <ConteudoUsuario params={params} />
      </Suspense>
    </section>
  );
}

async function ConteudoUsuario({ params }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const { id } = await params;
  const usuario = await consultarUsuarioGerenciavel(id, autor);
  if (!usuario) notFound();

  const tipoVinculo =
    usuario.perfil === "COORDENACAO" || usuario.perfil === "SECRETARIA" ? "unidadeIds" : "equipeIds";
  const vinculosIniciais = tipoVinculo === "unidadeIds" ? usuario.unidadeIds : usuario.equipeIds;
  const opcoes = await listarOpcoesDeVinculo(autor, usuario.perfil, usuario.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Detalhes do usuário</h1>
        <p>{usuario.email}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border px-2 py-0.5 text-sm">{rotuloDoPerfil(usuario.perfil)}</span>
          <span className="rounded border px-2 py-0.5 text-sm">{rotuloDoEstadoAcesso(usuario.estadoAcesso)}</span>
        </div>
        <p className="text-sm text-gray-600">O e-mail e o perfil não podem ser alterados nesta tela.</p>
      </div>

      <FormularioEdicaoUsuario
        key={`${usuario.id}:${usuario.ativo}`}
        acao={atualizarUsuario.bind(null, usuario.id)}
        nome={usuario.nome}
        opcoes={opcoes}
        tipoVinculo={tipoVinculo}
        vinculosIniciais={vinculosIniciais}
      />

      <ControleAtivacaoUsuario
        acao={alterarAtivacao.bind(null, usuario.id)}
        ativo={usuario.ativo}
      />

      {usuario.ativo && usuario.estadoAcesso !== "ATIVO" && (
        <Link className="inline-block underline" href={`/cadastros/usuarios/${usuario.id}/convites`}>
          Gerenciar convite
        </Link>
      )}
    </div>
  );
}
