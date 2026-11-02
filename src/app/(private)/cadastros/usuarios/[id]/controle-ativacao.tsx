"use client";

import { useActionState } from "react";

import type { EstadoEdicaoUsuario } from "./actions";

type Props = {
  acao: (estado: EstadoEdicaoUsuario, formData: FormData) => Promise<EstadoEdicaoUsuario>;
  ativo: boolean;
};

export function ControleAtivacaoUsuario({ acao, ativo }: Props) {
  const [estado, executar, executando] = useActionState(acao, {});

  return (
    <form
      action={executar}
      className="space-y-3 rounded border p-4"
      onSubmit={(evento) => {
        if (ativo && !window.confirm("Inativar este usuário, encerrar suas sessões e revogar convites pendentes?")) {
          evento.preventDefault();
        }
      }}
    >
      <h2 className="text-lg font-semibold">Situação do usuário</h2>
      <p className="text-sm text-gray-600">
        {ativo
          ? "A inativação encerra as sessões e revoga os convites pendentes."
          : "Antes de ativar, confirme se os vínculos do usuário estão corretos."}
      </p>
      <button
        className="rounded border px-3 py-2"
        disabled={executando}
        name="operacao"
        type="submit"
        value={ativo ? "INATIVAR" : "ATIVAR"}
      >
        {executando ? "Processando…" : ativo ? "Inativar usuário" : "Ativar usuário"}
      </button>
      {estado.sucesso && <p className="text-sm text-green-700">{estado.sucesso}</p>}
      {estado.erro && (
        <p className="text-sm text-red-700" aria-live="polite">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
