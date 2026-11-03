"use client";

import { useActionState, useState } from "react";
import { chaveDoPeriodo, type DatasPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { EstadoPeriodo } from "./actions";

type Props = {
  acao: (estado: EstadoPeriodo, formData: FormData) => Promise<EstadoPeriodo>;
  unidade: string;
  valores?: DatasPeriodo;
  somenteLeitura?: boolean;
  emUso?: boolean;
};
const PADRAO: DatasPeriodo = { inicio: "", fim: "" };

export function FormularioPeriodo({ acao, ...props }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return <CamposPeriodo {...props} estado={estado} enviar={enviar} enviando={enviando} />;
}

function CamposPeriodo({
  unidade, valores = PADRAO, somenteLeitura = false, emUso = false, estado, enviar, enviando,
}: Omit<Props, "acao"> & { estado: EstadoPeriodo; enviar: (formData: FormData) => void; enviando: boolean }) {
  const [rascunho, setRascunho] = useState<{ base: DatasPeriodo; datas: DatasPeriodo } | null>(null);
  const base = rascunho?.base ?? valores;
  const datas = rascunho?.datas ?? valores;
  const bloqueado = somenteLeitura || emUso;
  const externo = rascunho !== null && chaveDoPeriodo(base) !== chaveDoPeriodo(valores);
  return (
    <form action={bloqueado ? undefined : enviar} className="space-y-5 rounded border p-4"
      onSubmit={(evento) => { if (bloqueado) evento.preventDefault(); }}>
      <label className="block space-y-1">
        <span>Unidade</span>
        <input className="w-full rounded border px-3 py-2" value={unidade} readOnly disabled />
      </label>
      {valores !== PADRAO && <input name="versao" type="hidden" value={JSON.stringify(base)} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span>Data de início</span>
          <input className="w-full rounded border px-3 py-2" name="inicio" type="date" required min="0001-01-01" max="9999-12-31"
            value={datas.inicio} disabled={bloqueado || enviando}
            onChange={(evento) => setRascunho({ base, datas: { ...datas, inicio: evento.target.value } })} />
        </label>
        <label className="block space-y-1">
          <span>Data de fim</span>
          <input className="w-full rounded border px-3 py-2" name="fim" type="date" required min="0001-01-01" max="9999-12-31"
            value={datas.fim} disabled={bloqueado || enviando}
            onChange={(evento) => setRascunho({ base, datas: { ...datas, fim: evento.target.value } })} />
        </label>
      </div>
      {emUso && <p className="text-sm text-gray-600">As datas estão bloqueadas porque este período possui configurações de atendimento ou agendamentos.</p>}
      {externo && (
        <div className="space-y-2 rounded border border-amber-600 p-3 text-sm" role="alert">
          <p>Este período foi alterado em outra sessão. Suas alterações locais foram preservadas.</p>
          <button type="button" className="underline" disabled={enviando} onClick={() => setRascunho(null)}>Descartar alterações locais e carregar a versão mais recente</button>
        </div>
      )}
      {estado.erro && <p className="text-sm text-red-700" role="alert">{estado.erro}</p>}
      {!bloqueado && <button className="rounded border px-3 py-2" type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : valores === PADRAO ? "Criar período" : "Salvar alterações"}
      </button>}
    </form>
  );
}
