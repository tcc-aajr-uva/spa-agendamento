"use client";

import { useActionState, useLayoutEffect, useState } from "react";

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
        <button
          className="rounded border px-3 py-2"
          disabled={executando}
          name="operacao"
          type="submit"
          value="GERAR"
        >
          {executando ? "Processando…" : estadoAcesso === "SEM_CONVITE" ? "Gerar convite" : "Gerar novo convite"}
        </button>
        {estadoAcesso === "CONVITE_PENDENTE" && (
          <button
            className="rounded border px-3 py-2"
            disabled={executando}
            name="operacao"
            type="submit"
            value="REVOGAR"
          >
            Revogar convite
          </button>
        )}
      </form>

      {estado.mensagem && <p className="text-sm">{estado.mensagem}</p>}
      {estado.linkConvite && (
        <LinkConviteGerado key={estado.linkConvite} expiraEm={estado.expiraEm} linkConvite={estado.linkConvite} />
      )}
      {estado.erro && (
        <p className="text-sm text-red-700" aria-live="polite">
          {estado.erro}
        </p>
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
    <div className="space-y-2 rounded border p-4">
      <input className="w-full rounded border px-3 py-2" readOnly value={linkConvite} />
      {expiraEm && <p className="text-sm text-gray-600">Expira em {new Date(expiraEm).toLocaleString("pt-BR")}.</p>}
      <button className="rounded border px-3 py-2" onClick={copiar} type="button">
        {copiado ? "Link copiado" : "Copiar link"}
      </button>
      {erroCopia && (
        <p className="text-sm text-red-700" aria-live="polite">
          Não foi possível copiar automaticamente. Selecione o link e copie manualmente.
        </p>
      )}
    </div>
  );
}
