"use client";

import { useState } from "react";

type Props = {
  expiraEm: string;
  linkConvite: string;
  cadastrarOutro: () => void;
  voltarParaLista: () => void;
};

export function ResultadoConvite({ expiraEm, linkConvite, cadastrarOutro, voltarParaLista }: Props) {
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
    <div className="space-y-3 rounded border p-4">
      <p>Usuário criado. Compartilhe o link abaixo com a pessoa:</p>
      <input className="w-full rounded border px-3 py-2" readOnly value={linkConvite} />
      <p className="text-sm text-gray-600">
        O convite poderá ser usado uma única vez e expira em {formatarData(expiraEm)}.
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="rounded border px-3 py-2" type="button" onClick={copiar}>
          {copiado ? "Link copiado" : "Copiar link"}
        </button>
        <button className="rounded border px-3 py-2" type="button" onClick={cadastrarOutro}>
          Cadastrar outro
        </button>
        <button className="rounded border px-3 py-2" type="button" onClick={voltarParaLista}>
          Voltar à lista
        </button>
      </div>
      {erroCopia && (
        <p className="text-sm text-red-700" aria-live="polite">
          Não foi possível copiar automaticamente. Selecione o link acima e copie manualmente.
        </p>
      )}
    </div>
  );
}

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}
