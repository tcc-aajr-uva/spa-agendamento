"use client";

import { useActionState, useState } from "react";
import type { EstadoAtendimento } from "./actions-atendimento";
import { MensagemSucesso } from "../../unidades/mensagem-sucesso";

type Valores = { liberado: boolean; limitePacientes: number; versao: string | null };
type Props = {
  acao: (estado: EstadoAtendimento, formData: FormData) => Promise<EstadoAtendimento>;
  valores: Valores;
};

export function FormularioAtendimento({ acao, ...props }: Props) {
  const [estado, enviar, enviando] = useActionState<EstadoAtendimento, FormData>(async (anterior, dados) => {
    const resultado = await acao(anterior, dados);
    return { ...resultado, confirmacao: resultado.confirmacao ?? anterior.confirmacao };
  }, {});
  return <CamposAtendimento key={estado.confirmacao ?? "inicial"} {...props} estado={estado} enviar={enviar} enviando={enviando} />;
}

function CamposAtendimento({ valores, estado, enviar, enviando }: Omit<Props, "acao"> & {
  estado: EstadoAtendimento; enviar: (formData: FormData) => void; enviando: boolean;
}) {
  const [rascunho, setRascunho] = useState<{ base: Valores; liberado: boolean; limite: string } | null>(null);
  const base = rascunho?.base ?? valores;
  const liberado = rascunho?.liberado ?? valores.liberado;
  const limite = rascunho?.limite ?? String(valores.limitePacientes);
  const externo = rascunho !== null && base.versao !== valores.versao;

  return (
    <form action={enviar} className="space-y-4 rounded border p-4">
      <input name="versao" type="hidden" value={base.versao ?? ""} />
      <label className="flex items-center gap-2">
        <input name="liberado" type="checkbox" checked={liberado} disabled={enviando}
          onChange={(evento) => setRascunho({ base, liberado: evento.target.checked, limite })} />
        <span>Liberado para atender</span>
      </label>
      <label className="block space-y-1">
        <span>Limite de pacientes</span>
        <input className="w-full rounded border px-3 py-2" name="limitePacientes" type="number"
          min={0} max={2_147_483_647} step={1} required value={limite} disabled={enviando}
          onChange={(evento) => setRascunho({ base, liberado, limite: evento.target.value })} />
      </label>
      <p className="text-sm text-gray-600">Com limite zero, o estagiário não recebe novos agendamentos nesta equipe. Bloquear o atendimento não cancela os agendamentos existentes.</p>
      {externo && <div className="space-y-2 rounded border border-amber-600 p-3 text-sm" role="alert">
        <p>A configuração foi alterada em outra sessão. Suas alterações locais foram preservadas.</p>
        <button className="underline" type="button" disabled={enviando} onClick={() => setRascunho(null)}>
          Descartar alterações locais e carregar a versão mais recente
        </button>
      </div>}
      {estado.erro && <p className="text-sm text-red-700" role="alert">{estado.erro}</p>}
      {estado.sucesso && <MensagemSucesso key={estado.confirmacao} texto={estado.sucesso} />}
      <button className="rounded border px-3 py-2" type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar configuração de atendimento"}
      </button>
    </form>
  );
}
