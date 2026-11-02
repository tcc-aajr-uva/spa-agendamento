"use client";

import { useActionState } from "react";

import type { EstadoUnidade } from "../actions";
import { MensagemSucesso } from "../mensagem-sucesso";

type Props = {
  acao: (estado: EstadoUnidade, formData: FormData) => Promise<EstadoUnidade>;
  ativa: boolean;
};

export function ControleAtivacaoUnidade({ acao, ativa }: Props) {
  const [estado, executar, executando] = useActionState(acao, {});
  return (
    <form
      action={executar}
      className="space-y-3 rounded border p-4"
      onSubmit={(evento) => {
        if (ativa && !window.confirm("Inativar esta unidade? Ela deixará de aparecer nos escopos e agendamentos.")) {
          evento.preventDefault();
        }
      }}
    >
      <h2 className="text-lg font-semibold">Situação da unidade</h2>
      <p className="text-sm text-gray-600">
        {ativa
          ? "A inativação preserva os dados existentes, mas remove a unidade dos fluxos ativos."
          : "A ativação torna a unidade novamente disponível nos fluxos do sistema."}
      </p>
      <button className="rounded border px-3 py-2" disabled={executando} name="operacao" type="submit" value={ativa ? "INATIVAR" : "ATIVAR"}>
        {executando ? "Processando…" : ativa ? "Inativar unidade" : "Ativar unidade"}
      </button>
      {estado.sucesso && (
        <MensagemSucesso key={estado.versaoSucesso} texto={estado.sucesso} />
      )}
      {estado.erro && <p className="text-sm text-red-700" aria-live="polite">{estado.erro}</p>}
    </form>
  );
}
