"use client";

import { Loader2Icon } from "lucide-react";
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
      <div className="space-y-3 rounded border bg-card p-4 shadow-sm">
        <p>Senha criada com sucesso.</p>
        <Link className="underline underline-offset-4 hover:text-primary" href="/entrar">
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
          className="w-full rounded border bg-background px-3 py-2 hover:border-ring/50"
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
          className="w-full rounded border bg-background px-3 py-2 hover:border-ring/50"
          name="confirmacaoSenha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {estado.erro && (
        <p className="text-sm text-destructive" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="w-full rounded border px-3 py-2 hover:bg-muted disabled:opacity-50" disabled={enviando} type="submit">
        {enviando && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
        {enviando ? "Salvando…" : "Criar senha"}
      </button>
    </form>
  );
}
