"use client";

import { useActionState, useState } from "react";
import { chaveDaEquipe, type VersaoEquipe } from "@/lib/equipe/dados-equipe";
import type { EstadoEquipe } from "./actions";
import { MensagemSucesso } from "../unidades/mensagem-sucesso";

type Props = {
  acao: (estado: EstadoEquipe, formData: FormData) => Promise<EstadoEquipe>;
  unidades?: { id: string; nome: string }[];
  unidadeFixa?: string;
  supervisores: { id: string; nome: string; email: string; unidadeIds: string[]; qualquerUnidade: boolean }[];
  supervisorAtualNome?: string;
  somenteLeitura?: boolean;
  valores?: VersaoEquipe;
};

const VALORES_PADRAO: VersaoEquipe = { nome: "", unidadeId: "", ativa: true, supervisorId: null };

export function FormularioEquipe({ acao, valores = VALORES_PADRAO, ...props }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return <FormularioEditavel key={estado.versaoSucesso} {...props} valores={valores} estado={estado} enviar={enviar} enviando={enviando} />;
}

function FormularioEditavel({
  valores, unidades = [], unidadeFixa, supervisores, supervisorAtualNome, somenteLeitura = false, estado, enviar, enviando,
}: Omit<Props, "acao" | "valores"> & {
  valores: VersaoEquipe;
  estado: EstadoEquipe;
  enviar: (formData: FormData) => void;
  enviando: boolean;
}) {
  const [rascunho, setRascunho] = useState<{ base: VersaoEquipe; nome: string; unidadeId: string; supervisorId: string | null } | null>(null);
  const base = rascunho?.base ?? valores;
  const nome = rascunho?.nome ?? valores.nome;
  const unidadeId = rascunho?.unidadeId ?? valores.unidadeId;
  const supervisorId = rascunho ? rascunho.supervisorId : valores.supervisorId;
  const supervisoresDisponiveis = supervisores.filter((supervisor) => supervisor.qualquerUnidade || supervisor.unidadeIds.includes(unidadeId));
  const responsavelIndisponivel = supervisorId !== null && !supervisoresDisponiveis.some((supervisor) => supervisor.id === supervisorId);
  const atualizadaExternamente = rascunho !== null && chaveDaEquipe(base) !== chaveDaEquipe(valores);

  return (
    <form action={somenteLeitura ? undefined : enviar} className="space-y-5 rounded border p-4"
      onSubmit={(evento) => { if (somenteLeitura) evento.preventDefault(); }}>
      {unidadeFixa ? (
        <>
          <label className="block space-y-1">
            <span>Unidade</span>
            <input className="w-full rounded border px-3 py-2" value={unidadeFixa} readOnly disabled />
          </label>
          <input type="hidden" name="versao" value={chaveDaEquipe(base)} />
        </>
      ) : (
        <label className="block space-y-1">
          <span>Unidade</span>
          <select className="w-full rounded border px-3 py-2" name="unidadeId" required value={unidadeId} disabled={enviando || somenteLeitura}
            onChange={(evento) => setRascunho({ base, nome, unidadeId: evento.target.value, supervisorId: null })}>
            <option value="">Selecione uma unidade</option>
            {unidades.map((unidade) => <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>)}
          </select>
        </label>
      )}
      <label className="block space-y-1">
        <span>Nome da equipe</span>
        <input className="w-full rounded border px-3 py-2" name="nome" required minLength={2} maxLength={120} disabled={enviando || somenteLeitura}
          value={nome} onChange={(evento) => setRascunho({ base, nome: evento.target.value, unidadeId, supervisorId })} />
      </label>
      <label className="block space-y-1">
        <span>Supervisor responsável (opcional)</span>
        <select className="w-full rounded border px-3 py-2" name="supervisorId" value={supervisorId ?? ""}
          disabled={enviando || !unidadeId || somenteLeitura}
          onChange={(evento) => setRascunho({ base, nome, unidadeId, supervisorId: evento.target.value || null })}>
          <option value="">Sem supervisor responsável</option>
          {responsavelIndisponivel && <option value={supervisorId ?? ""}>{supervisorAtualNome ?? "Responsável anterior"}{!somenteLeitura && " (indisponível para nova atribuição)"}</option>}
          {supervisoresDisponiveis.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.nome} — {supervisor.email}</option>)}
        </select>
      </label>
      {!somenteLeitura && <p className="text-sm text-gray-600">Selecione um supervisor existente ou deixe a equipe sem responsável. Novos supervisores podem ser cadastrados em Usuários.</p>}
      {atualizadaExternamente && (
        <div className="space-y-2 rounded border border-amber-600 p-3 text-sm" role="alert">
          <p>Esta equipe foi alterada em outra sessão. Suas alterações locais foram preservadas.</p>
          <button type="button" className="underline" disabled={enviando} onClick={() => setRascunho(null)}>
            Descartar alterações locais e carregar a versão mais recente
          </button>
        </div>
      )}
      {estado.erro && <p className="text-sm text-red-700" role="alert">{estado.erro}</p>}
      {estado.sucesso && <MensagemSucesso key={estado.versaoSucesso} texto={estado.sucesso} />}
      {!somenteLeitura && <button className="rounded border px-3 py-2" disabled={enviando} type="submit">
        {enviando ? "Salvando…" : unidadeFixa ? "Salvar alterações" : "Criar equipe"}
      </button>}
    </form>
  );
}
