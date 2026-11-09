"use client";

import { useActionState, useEffect, useLayoutEffect, useState } from "react";
import { CopyIcon } from "lucide-react";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
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

  useEffect(() => {
    if (!estado.mensagem) return;

    toast.add({ title: estado.mensagem, type: "success", timeout: 5_000 });
  }, [estado]);

  return (
    <div className="space-y-3">
      {estado.erro && (
        <AlertaErroOperacao titulo="Não foi possível gerenciar o convite" mensagem={estado.erro} />
      )}

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
      {estado.linkConvite && (
        <LinkConviteGerado key={estado.linkConvite} expiraEm={estado.expiraEm} linkConvite={estado.linkConvite} />
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
          <AlertaErroOperacao titulo="Não foi possível copiar o link" mensagem="Selecione o link e copie manualmente." />
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
