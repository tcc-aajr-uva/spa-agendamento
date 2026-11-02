"use client";

import { useActionState, useState } from "react";

import { formatarHora } from "@/lib/agendamento/regras";

import type { EstadoUnidade } from "./actions";
import { MensagemSucesso } from "./mensagem-sucesso";

export type ValoresUnidade = {
  nome: string;
  permitePaciente: boolean;
  permiteEstagiario: boolean;
  permiteSecretaria: boolean;
  agendamentoAberto: boolean;
  horaAbertura: number;
  horaFechamento: number;
  duracaoBlocoMin: number;
  atualizadoEm?: string;
};

type Props = {
  acao: (estado: EstadoUnidade, formData: FormData) => Promise<EstadoUnidade>;
  valores?: ValoresUnidade;
  rotuloBotao: string;
  podeAlterarDadosAdministrativos?: boolean;
};

const VALORES_PADRAO: ValoresUnidade = {
  nome: "",
  permitePaciente: true,
  permiteEstagiario: true,
  permiteSecretaria: true,
  agendamentoAberto: false,
  horaAbertura: 480,
  horaFechamento: 1260,
  duracaoBlocoMin: 50,
};

export function FormularioUnidade({
  acao,
  valores = VALORES_PADRAO,
  rotuloBotao,
  podeAlterarDadosAdministrativos = true,
}: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  return (
    <FormularioEditavel
      key={estado.versaoSucesso}
      estado={estado}
      enviar={enviar}
      enviando={enviando}
      podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
      rotuloBotao={rotuloBotao}
      valores={valores}
    />
  );
}

function FormularioEditavel({
  estado,
  enviar,
  enviando,
  valores,
  rotuloBotao,
  podeAlterarDadosAdministrativos,
}: {
  estado: EstadoUnidade;
  enviar: (formData: FormData) => void;
  enviando: boolean;
  valores: ValoresUnidade;
  rotuloBotao: string;
  podeAlterarDadosAdministrativos: boolean;
}) {
  const [alterado, setAlterado] = useState(false);
  const chaveRecebida = chaveDosValores(valores);
  const [chaveDaEdicao, setChaveDaEdicao] = useState(chaveRecebida);
  const chaveExibida = alterado ? chaveDaEdicao : chaveRecebida;
  const possuiAtualizacaoExterna = alterado && chaveDaEdicao !== chaveRecebida;

  return (
    <form
      action={enviar}
      className="space-y-5 rounded border p-4"
      onChange={() => {
        if (!alterado) setChaveDaEdicao(chaveRecebida);
        setAlterado(true);
      }}
    >
      <CamposUnidade
        key={chaveExibida}
        podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
        valores={valores}
      />

      {possuiAtualizacaoExterna && (
        <div className="space-y-2 rounded border border-amber-600 p-3 text-sm" role="alert">
          <p>Esta unidade foi alterada em outra sessão. Suas alterações locais foram preservadas.</p>
          <button className="underline" onClick={() => setAlterado(false)} type="button">
            Descartar alterações locais e carregar a versão mais recente
          </button>
        </div>
      )}

      {estado.sucesso && (
        <MensagemSucesso key={estado.versaoSucesso} texto={estado.sucesso} />
      )}
      {estado.erro && <p className="text-sm text-red-700" aria-live="polite">{estado.erro}</p>}

      <button className="rounded border px-3 py-2" disabled={enviando} type="submit">
        {enviando ? "Salvando…" : rotuloBotao}
      </button>
    </form>
  );
}

function CamposUnidade({
  valores,
  podeAlterarDadosAdministrativos,
}: {
  valores: ValoresUnidade;
  podeAlterarDadosAdministrativos: boolean;
}) {
  return (
    <>
      {valores.atualizadoEm && <input defaultValue={valores.atualizadoEm} name="atualizadoEm" type="hidden" />}
      <label className="block space-y-1">
        <span>Nome</span>
        <input
          className="w-full rounded border px-3 py-2 read-only:bg-gray-100"
          defaultValue={valores.nome}
          maxLength={120}
          minLength={2}
          name="nome"
          readOnly={!podeAlterarDadosAdministrativos}
          required
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="font-medium">Quem pode agendar</legend>
        {!podeAlterarDadosAdministrativos && (
          <p className="text-sm text-gray-600">Somente a coordenação ou o administrador pode alterar estas permissões.</p>
        )}
        <OpcaoBooleana nome="permitePaciente" rotulo="Paciente" marcada={valores.permitePaciente} habilitada={podeAlterarDadosAdministrativos} />
        <OpcaoBooleana nome="permiteEstagiario" rotulo="Estagiário" marcada={valores.permiteEstagiario} habilitada={podeAlterarDadosAdministrativos} />
        <OpcaoBooleana nome="permiteSecretaria" rotulo="Secretaria" marcada={valores.permiteSecretaria} habilitada={podeAlterarDadosAdministrativos} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-medium">Agendamento e funcionamento</legend>
        <OpcaoBooleana nome="agendamentoAberto" rotulo="Agendamento aberto" marcada={valores.agendamentoAberto} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="block">Abertura</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={formatarHora(valores.horaAbertura)} name="horaAbertura" required type="time" />
          </label>
          <label className="space-y-1">
            <span className="block">Fechamento</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={formatarHora(valores.horaFechamento)} name="horaFechamento" required type="time" />
          </label>
          <label className="space-y-1">
            <span className="block">Duração do bloco (minutos)</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={valores.duracaoBlocoMin} max={720} min={1} name="duracaoBlocoMin" required type="number" />
          </label>
        </div>
      </fieldset>
    </>
  );
}

function OpcaoBooleana({
  nome,
  rotulo,
  marcada,
  habilitada = true,
}: {
  nome: string;
  rotulo: string;
  marcada: boolean;
  habilitada?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      {!habilitada && <input name={nome} type="hidden" value={String(marcada)} />}
      <input defaultChecked={marcada} disabled={!habilitada} name={habilitada ? nome : undefined} type="checkbox" />
      <span>{rotulo}</span>
    </label>
  );
}

function chaveDosValores(valores: ValoresUnidade): string {
  return [
    valores.nome,
    valores.permitePaciente,
    valores.permiteEstagiario,
    valores.permiteSecretaria,
    valores.agendamentoAberto,
    valores.horaAbertura,
    valores.horaFechamento,
    valores.duracaoBlocoMin,
    valores.atualizadoEm,
  ].join(":");
}
