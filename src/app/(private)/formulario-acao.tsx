"use client";

import { useActionState, type FormEvent, type ReactNode } from "react";
import type { EstadoAcao } from "./acao";
import { AvisoAoSair } from "./aviso-ao-sair";

type Props = {
  acao: (estado: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  rotulo: string;
  confirmacao?: string;
  children?: ReactNode;
};

export function FormularioAcao({ acao, rotulo, confirmacao, children }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    if (confirmacao && !window.confirm(confirmacao)) evento.preventDefault();
  }

  return (
    <form action={enviar} onSubmit={aoEnviar} className="flex flex-wrap items-end gap-2">
      {children}
      <button disabled={enviando} className="rounded border px-3 py-1">
        {enviando ? "Enviando…" : rotulo}
      </button>
      {estado.erro && (
        <p className="w-full text-sm text-red-400" aria-live="polite">
          {estado.erro}
        </p>
      )}
      {estado.mensagem && (
        <p className="w-full text-sm text-green-500" aria-live="polite">
          {estado.mensagem}
        </p>
      )}
      {estado.avisarAoSair && <AvisoAoSair />}
    </form>
  );
}
