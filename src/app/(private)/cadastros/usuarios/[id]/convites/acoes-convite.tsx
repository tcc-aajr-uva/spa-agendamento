"use client";

import { useActionState, useEffect, useLayoutEffect, useState } from "react";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { EstadoAcessoUsuario } from "@/lib/usuario/estado-acesso";
import type { EstadoGerenciamentoConvite } from "../../actions";
import { CartaoLinkConvite } from "../../cartao-link-convite";

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
        <CartaoLinkConvite
          key={estado.linkConvite}
          titulo="Link do convite"
          descricao="Compartilhe este link somente com o usuário correspondente."
          linkConvite={estado.linkConvite}
          validade={estado.expiraEm && `Expira em ${new Date(estado.expiraEm).toLocaleString("pt-BR")}.`}
        />
      )}
    </div>
  );
}
