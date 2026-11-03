import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon, InfoIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUsuarioGerenciavel } from "@/lib/usuario/consultar-usuario-gerenciavel";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { podeConfigurarAtendimento } from "@/lib/usuario/atendimento-estagiario";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { rotuloDoEstadoAcesso, rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { perfisDaRota } from "../../../menu";
import { gerenciarConvite } from "../actions";
import { AbasUsuario } from "./abas-usuario";
import { alterarAtivacao, atualizarUsuario } from "./actions";
import { ControleAtivacaoUsuario } from "./controle-ativacao";
import { AcoesConvite } from "./convites/acoes-convite";
import { FormularioEdicaoUsuario } from "./formulario-edicao";
import { SecaoAtendimento } from "./secao-atendimento";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametrosBusca>;
};

export default function UsuarioPage({ params, searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/usuarios" />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para usuários
      </Button>
      <Suspense fallback={<p>Carregando usuário…</p>}>
        <ConteudoUsuario params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ConteudoUsuario({ params, searchParams }: Props) {
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{usuario.nome}</h1>
          <Badge variant="outline">{rotuloDoPerfil(usuario.perfil)}</Badge>
          <Badge variant={usuario.estadoAcesso === "ATIVO" ? "default" : "outline"}>
            {rotuloDoEstadoAcesso(usuario.estadoAcesso)}
          </Badge>
        </div>
        <p>{usuario.email}</p>
        <p className="text-sm text-muted-foreground">O e-mail e o perfil não podem ser alterados nesta tela.</p>
      </div>

      <AbasUsuario
        atendimento={
          usuario.perfil === "ESTAGIARIO" && podeConfigurarAtendimento(autor) ? (
            <Suspense fallback={<p>Carregando configuração de atendimento…</p>}>
              <SecaoAtendimento estagiarioId={usuario.id} autor={autor} searchParams={searchParams} />
            </Suspense>
          ) : undefined
        }
        dados={
          <>
            <FormularioEdicaoUsuario
              key={`${usuario.id}:${usuario.ativo}`}
              acao={atualizarUsuario.bind(null, usuario.id)}
              nome={usuario.nome}
              opcoes={opcoes}
              possuiVinculosForaDoEscopo={usuario.possuiVinculosForaDoEscopo}
              restringirEquipesAUmaUnidade={usuario.perfil === "ESTAGIARIO"}
              tipoVinculo={tipoVinculo}
              vinculosIniciais={vinculosIniciais}
            />
            {usuario.podeAlterarAcesso ? (
              <ControleAtivacaoUsuario acao={alterarAtivacao.bind(null, usuario.id)} ativo={usuario.ativo} />
            ) : (
              <Alert>
                <InfoIcon aria-hidden="true" />
                <AlertTitle>Alteração de acesso indisponível</AlertTitle>
                <AlertDescription>
                  O acesso global só pode ser alterado pelo administrador ou por uma coordenação responsável por todas as
                  unidades deste usuário.
                </AlertDescription>
              </Alert>
            )}
          </>
        }
        convite={
          <Card className="sm:[--card-spacing:--spacing(6)]">
            <CardHeader>
              <CardTitle>Acesso ao sistema</CardTitle>
              <CardDescription>Gere ou revogue o convite usado para definir a senha inicial.</CardDescription>
            </CardHeader>
            <CardContent>
              {usuario.estadoAcesso === "ATIVO" ? (
                <p>Este usuário já definiu a senha e possui acesso ao sistema.</p>
              ) : usuario.estadoAcesso === "INATIVO" ? (
                <p>Ative o usuário antes de gerar um convite.</p>
              ) : (
                <AcoesConvite acao={gerenciarConvite.bind(null, usuario.id)} estadoAcesso={usuario.estadoAcesso} />
              )}
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
