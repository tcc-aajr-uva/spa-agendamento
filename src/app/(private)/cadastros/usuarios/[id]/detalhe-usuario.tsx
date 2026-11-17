import { Suspense } from "react";
import { notFound } from "next/navigation";

import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUsuarioGerenciavel } from "@/lib/usuario/consultar-usuario-gerenciavel";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { podeConfigurarAtendimento } from "@/lib/usuario/atendimento-estagiario";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { rotuloDoEstadoAcesso, rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { perfisDaRota } from "../../../menu";
import { gerenciarConvite } from "../actions";
import { alterarAtivacao, atualizarUsuario } from "./actions";
import { EdicaoUsuario } from "./edicao-usuario";
import { AcoesConvite } from "./convites/acoes-convite";
import { SecaoAtendimento } from "./secao-atendimento";

type Props = {
  id: string;
  searchParams: Promise<ParametrosBusca>;
  paginaCheia?: boolean;
  secao?: "dados" | "ativacao" | "atendimento" | "acesso";
};

export async function DetalheUsuario({ id, searchParams, paginaCheia = false, secao }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const usuario = await consultarUsuarioGerenciavel(id, autor);
  if (!usuario) {
    if (paginaCheia) notFound();
    return <p className="text-muted-foreground">Usuário não encontrado.</p>;
  }

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
        {(!secao || secao === "dados") && <p className="text-sm text-muted-foreground">O e-mail e o perfil não podem ser alterados nesta tela.</p>}
      </div>

      <EdicaoUsuario
        secao={secao}
        acaoAtualizar={atualizarUsuario.bind(null, usuario.id)}
        acaoAtivacao={alterarAtivacao.bind(null, usuario.id)}
        ativo={usuario.ativo}
        podeAlterarAcesso={usuario.podeAlterarAcesso}
        {...opcoes}
        perfil={usuario.perfil}
        unidadesFixas={autor.perfil === "SUPERVISOR"}
        possuiVinculosForaDoEscopo={usuario.possuiVinculosForaDoEscopo}
        possuiUnidadeAtivaForaDoEscopo={usuario.possuiUnidadeAtivaForaDoEscopo}
        valores={{ nome: usuario.nome, atualizadoEm: usuario.atualizadoEm.toISOString(),
          unidadeIds: usuario.unidadeIds,
          equipeIds: usuario.equipeIds }}
        atendimento={
          usuario.perfil === "ESTAGIARIO" && podeConfigurarAtendimento(autor) ? (
            <Suspense fallback={<IndicadorCarregando texto="Carregando configuração de atendimento…" />}>
              <SecaoAtendimento estagiarioId={usuario.id} autor={autor} searchParams={searchParams} />
            </Suspense>
          ) : undefined
        }
        convite={
          <Card className="sm:[--card-spacing:--spacing(6)] has-data-[slot=card-footer]:pb-(--card-spacing)">
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
