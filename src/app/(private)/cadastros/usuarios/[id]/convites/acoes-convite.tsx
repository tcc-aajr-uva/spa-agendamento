"use client";

import { useActionState, useLayoutEffect, useState } from "react";
import { CircleAlertIcon, CopyIcon, InfoIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { EstadoAcessoUsuario } from "@/lib/usuario/estado-acesso";
import type { EstadoGerenciamentoConvite } from "../../actions";

type Props = {
  acao: (estado: EstadoGerenciamentoConvite, formData: FormData) => Promise<EstadoGerenciamentoConvite>;
  estadoAcesso: EstadoAcessoUsuario;
};

export function AcoesConvite(props: Props) {
  const [versao, setVersao] = useState(0);

  useLayoutEffect(() => () => setVersao((atual) => atual + 1), []);

  return <AcoesConviteInternas key={versao} {...props} />;
}

function AcoesConviteInternas({ acao, estadoAcesso }: Props) {
  const [estado, executar, executando] = useActionState(acao, {});

  return (
    <div className="space-y-3">
      <form action={executar} className="flex flex-wrap gap-2">
        <Button
          disabled={executando}
          name="operacao"
          type="submit"
          value="GERAR"
        >
          {executando ? "Processando…" : estadoAcesso === "SEM_CONVITE" ? "Gerar convite" : "Gerar novo convite"}
        </Button>
        {estadoAcesso === "CONVITE_PENDENTE" && (
          <Button
            variant="destructive"
            disabled={executando}
            name="operacao"
            type="submit"
            value="REVOGAR"
          >
            Revogar convite
          </Button>
        )}
      </form>

      {estado.mensagem && (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Convite atualizado</AlertTitle>
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      {estado.linkConvite && (
        <LinkConviteGerado key={estado.linkConvite} expiraEm={estado.expiraEm} linkConvite={estado.linkConvite} />
      )}
      {estado.erro && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível gerenciar o convite</AlertTitle>
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function LinkConviteGerado({ linkConvite, expiraEm }: { linkConvite: string; expiraEm?: string }) {
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setErroCopia(false);
    } catch {
      setErroCopia(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link do convite</CardTitle>
        <CardDescription>Compartilhe este link somente com o usuário correspondente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input className="h-auto px-3 py-2 leading-5 shadow-xs" aria-label="Link do convite" readOnly value={linkConvite} />
        {expiraEm && <p className="text-sm text-muted-foreground">Expira em {new Date(expiraEm).toLocaleString("pt-BR")}.</p>}
        {erroCopia && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Não foi possível copiar o link</AlertTitle>
            <AlertDescription>Selecione o link e copie manualmente.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={copiar} type="button">
          <CopyIcon aria-hidden="true" /> {copiado ? "Link copiado" : "Copiar link"}
        </Button>
      </CardFooter>
    </Card>
  );
}
