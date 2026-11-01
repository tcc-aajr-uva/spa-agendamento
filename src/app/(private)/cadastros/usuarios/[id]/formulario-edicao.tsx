"use client";

import { useActionState, useState } from "react";

import type { EstadoEdicaoUsuario } from "./actions";

type Opcao = { id: string; nome: string; disponivel: boolean };

type Props = {
  acao: (estado: EstadoEdicaoUsuario, formData: FormData) => Promise<EstadoEdicaoUsuario>;
  nome: string;
  opcoes: Opcao[];
  tipoVinculo: "unidadeIds" | "equipeIds";
  vinculosIniciais: string[];
};

export function FormularioEdicaoUsuario({ acao, nome, opcoes, tipoVinculo, vinculosIniciais }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [vinculos, setVinculos] = useState(vinculosIniciais);

  return (
    <form action={enviar} className="space-y-4 rounded border p-4">
      <h2 className="text-lg font-semibold">Dados e vínculos</h2>

      <label className="block space-y-1">
        <span>Nome</span>
        <input
          className="w-full rounded border px-3 py-2"
          defaultValue={nome}
          maxLength={120}
          minLength={2}
          name="nome"
          required
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="font-medium">{tipoVinculo === "unidadeIds" ? "Unidades" : "Equipes"}</legend>
        <select
          className="w-full rounded border px-3 py-2"
          defaultValue=""
          onChange={(evento) => {
            const id = evento.target.value;
            if (id) setVinculos((atuais) => [...atuais, id]);
            evento.target.value = "";
          }}
        >
          <option value="">Selecione para adicionar</option>
          {opcoes
            .filter((opcao) => opcao.disponivel && !vinculos.includes(opcao.id))
            .map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.nome}
              </option>
            ))}
        </select>
      </fieldset>

      {vinculos.map((id) => {
        const opcao = opcoes.find((candidata) => candidata.id === id);
        if (!opcao) return null;
        return (
          <div className="flex items-center justify-between gap-3 rounded border px-3 py-2" key={id}>
            <input name={tipoVinculo} type="hidden" value={id} />
            <span>{opcao.nome}</span>
            <button
              aria-label={`Remover ${opcao.nome}`}
              className="underline"
              onClick={() => setVinculos((atuais) => atuais.filter((vinculoId) => vinculoId !== id))}
              type="button"
            >
              Remover
            </button>
          </div>
        );
      })}

      {vinculos.length === 0 && <p className="text-sm text-gray-600">Selecione ao menos um vínculo.</p>}
      {estado.sucesso && <p className="text-sm text-green-700">{estado.sucesso}</p>}
      {estado.erro && (
        <p className="text-sm text-red-700" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="rounded border px-3 py-2" disabled={enviando || vinculos.length === 0} type="submit">
        {enviando ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
