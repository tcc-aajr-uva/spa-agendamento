"use client";

import { useActionState } from "react";
import { alterarSituacaoSala, criarSala } from "./actions";

type Unidade = { id: string; nome: string };

export function FormularioNovaSala({ unidades }: { unidades: Unidade[] | null }) {
  const [estado, enviar, enviando] = useActionState(criarSala, {});

  return (
    <form action={enviar} className="flex flex-col gap-3">
      {unidades && (
        <label className="flex flex-col gap-1">
          Unidade
          <select name="unidadeId" required className="rounded border bg-transparent px-2 py-1">
            {unidades.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1">
        Nome da sala
        <input name="nome" required maxLength={60} className="rounded border bg-transparent px-2 py-1" />
      </label>
      <p aria-live="polite" className={estado.erro ? "text-red-400" : undefined}>
        {estado.erro ?? estado.mensagem}
      </p>
      <button disabled={enviando} className="rounded border px-3 py-2">
        {enviando ? "Salvando…" : "Cadastrar sala"}
      </button>
    </form>
  );
}

export function BotaoSituacaoSala({ salaId, nome, ativa }: { salaId: string; nome: string; ativa: boolean }) {
  const [estado, enviar, enviando] = useActionState(alterarSituacaoSala, {});
  const acao = ativa ? "Desativar" : "Ativar";

  return (
    <form action={enviar} className="inline">
      <input type="hidden" name="salaId" value={salaId} />
      <input type="hidden" name="ativar" value={String(!ativa)} />
      <button disabled={enviando} aria-label={`${acao} ${nome}`} className="rounded border px-2 text-sm">
        {enviando ? "…" : acao}
      </button>
      {estado.erro && (
        <span role="alert" className="ml-2 text-sm text-red-400">
          {estado.erro}
        </span>
      )}
    </form>
  );
}
