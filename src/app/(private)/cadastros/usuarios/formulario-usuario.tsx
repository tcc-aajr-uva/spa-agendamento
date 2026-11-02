"use client";

import { useActionState, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";

import type { Perfil } from "@/generated/prisma/client";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import type { EstadoCriacaoUsuario } from "./actions";
import { ResultadoConvite } from "./resultado-convite";

type Opcao = { id: string; unidadeId: string; nome: string };

type ConfiguracaoPerfil = {
  perfil: Perfil;
  tipoVinculo: "unidadeIds" | "equipeIds";
  opcoes: Opcao[];
};

type Props = {
  acao: (estado: EstadoCriacaoUsuario, formData: FormData) => Promise<EstadoCriacaoUsuario>;
  configuracoes: ConfiguracaoPerfil[];
};

export function FormularioUsuario({ acao, configuracoes }: Props) {
  const router = useRouter();
  const [versao, setVersao] = useState(0);

  const voltarParaLista = () => {
    flushSync(() => setVersao((atual) => atual + 1));
    router.push("/cadastros/usuarios");
  };

  const cadastrarOutro = () => setVersao((atual) => atual + 1);

  return (
    <FormularioUsuarioInterno
      key={`${router.bfcacheId}:${versao}`}
      acao={acao}
      cadastrarOutro={cadastrarOutro}
      configuracoes={configuracoes}
      voltarParaLista={voltarParaLista}
    />
  );
}

function FormularioUsuarioInterno({
  acao,
  cadastrarOutro,
  configuracoes,
  voltarParaLista,
}: Props & { cadastrarOutro: () => void; voltarParaLista: () => void }) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [vinculos, setVinculos] = useState<string[]>([]);
  const [perfil, setPerfil] = useState(configuracoes[0]?.perfil ?? "");
  const configuracao = configuracoes.find((candidata) => candidata.perfil === perfil);
  const tipoVinculo = configuracao?.tipoVinculo ?? "unidadeIds";
  const opcoes = configuracao?.opcoes ?? [];
  const unidadeSelecionada = opcoes.find((opcao) => vinculos.includes(opcao.id))?.unidadeId;
  const opcoesDisponiveis = opcoes.filter(
    (opcao) =>
      !vinculos.includes(opcao.id) &&
      (perfil !== "ESTAGIARIO" || unidadeSelecionada === undefined || opcao.unidadeId === unidadeSelecionada),
  );

  if (estado.linkConvite && estado.expiraEm) {
    return (
      <ResultadoConvite
        cadastrarOutro={cadastrarOutro}
        expiraEm={estado.expiraEm}
        linkConvite={estado.linkConvite}
        voltarParaLista={voltarParaLista}
      />
    );
  }

  return (
    <form action={enviar} className="space-y-4 rounded border p-4">
      <label className="block space-y-1">
        <span>Perfil</span>
        <select
          className="w-full rounded border px-3 py-2"
          name="perfil"
          onChange={(evento) => {
            setPerfil(evento.target.value as Perfil);
            setVinculos([]);
          }}
          value={perfil}
        >
          {configuracoes.map((opcao) => (
            <option key={opcao.perfil} value={opcao.perfil}>
              {rotuloDoPerfil(opcao.perfil)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span>Nome</span>
        <input className="w-full rounded border px-3 py-2" name="nome" required minLength={2} maxLength={120} />
      </label>

      <label className="block space-y-1">
        <span>E-mail</span>
        <input className="w-full rounded border px-3 py-2" name="email" type="email" required />
      </label>

      <fieldset className="space-y-2">
        <legend className="font-medium">{tipoVinculo === "unidadeIds" ? "Unidades" : "Equipes"}</legend>
        {opcoes.length === 0 ? (
          <p className="text-sm text-gray-600">Não há vínculos disponíveis para criar este perfil.</p>
        ) : (
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
            {opcoesDisponiveis.map((opcao) => (
                <option key={opcao.id} value={opcao.id}>
                  {opcao.nome}
                </option>
              ))}
          </select>
        )}
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
      {opcoes.length > 0 && vinculos.length === 0 && (
        <p className="text-sm text-gray-600">Selecione ao menos um vínculo para continuar.</p>
      )}
      {vinculos.length > 0 && <p className="text-sm">{vinculos.length} vínculo(s) selecionado(s).</p>}

      {estado.erro && (
        <p className="text-sm text-red-700" aria-live="polite">
          {estado.erro}
        </p>
      )}

      <button className="rounded border px-3 py-2" disabled={enviando || vinculos.length === 0} type="submit">
        {enviando ? "Criando…" : "Criar usuário e gerar convite"}
      </button>
    </form>
  );
}

