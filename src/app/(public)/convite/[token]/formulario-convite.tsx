"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EstadoAceiteConvite } from "./actions";

type Props = {
  acao: (estado: EstadoAceiteConvite, formData: FormData) => Promise<EstadoAceiteConvite>;
};

export function FormularioConvite({ acao }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  if (estado.sucesso) {
    return (
      <div className="space-y-3 rounded border p-4">
        <p>Senha criada com sucesso.</p>
        <Link className="underline" href="/entrar">
          Entrar no sistema
        </Link>
      </div>
    );
  }

  return (
    <form action={enviar} className="space-y-4">
      <label className="block space-y-1">
        <span>Senha</span>
        <input
          className="w-full rounded border px-3 py-2"
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <label className="block space-y-1">
        <span>Confirme a senha</span>
        <input
          className="w-full rounded border px-3 py-2"
          name="confirmacaoSenha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {estado.erro && (
        <p className="text-sm text-red-700" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="w-full rounded border px-3 py-2" disabled={enviando} type="submit">
        {enviando ? "Salvando…" : "Criar senha"}
      </button>
    </form>
  );
}
