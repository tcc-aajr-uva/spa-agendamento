"use client";

import { useActionState } from "react";
import { chaveDaEquipe, type VersaoEquipe } from "@/lib/equipe/dados-equipe";
import type { EstadoEquipe } from "../actions";
import { MensagemSucesso } from "../../unidades/mensagem-sucesso";

type Props = {
  acao: (estado: EstadoEquipe, formData: FormData) => Promise<EstadoEquipe>;
  valores: VersaoEquipe;
};

export function ControleAtivacaoEquipe({ acao, valores }: Props) {
  const [estado, executar, executando] = useActionState(acao, {});
  return (
    <form action={executar} className="space-y-3 rounded border p-4" onSubmit={(evento) => {
      if (valores.ativa && !window.confirm("Inativar esta equipe? Seus vínculos e agendamentos serão preservados.")) evento.preventDefault();
    }}>
      <h2 className="text-lg font-semibold">Situação da equipe</h2>
      <p className="text-sm text-gray-600">A inativação retira a equipe dos fluxos ativos e preserva os vínculos e agendamentos existentes, sem cancelá-los automaticamente.</p>
      <input type="hidden" name="versao" value={chaveDaEquipe(valores)} />
      <button className="rounded border px-3 py-2" disabled={executando} type="submit" name="operacao" value={valores.ativa ? "INATIVAR" : "ATIVAR"}>
        {executando ? "Processando…" : valores.ativa ? "Inativar equipe" : "Ativar equipe"}
      </button>
      {estado.erro && <p className="text-sm text-red-700" role="alert">{estado.erro}</p>}
      {estado.sucesso && <MensagemSucesso key={estado.versaoSucesso} texto={estado.sucesso} />}
    </form>
  );
}
