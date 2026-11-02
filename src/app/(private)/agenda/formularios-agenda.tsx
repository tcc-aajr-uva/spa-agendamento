"use client";

import { createContext, type ReactNode, useActionState, useContext, useState } from "react";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { adicionarHorario, type EstadoAgenda, removerHorario, trocarHorario } from "./actions";

type Grade = { dias: number[]; horas: number[] };

export function FormularioNovoHorario({ dias, horas }: Grade) {
  const [estado, enviar, enviando] = useActionState(adicionarHorario, {});

  return (
    <form action={enviar} className="flex flex-wrap items-end gap-3">
      <SeletoresHorario dias={dias} horas={horas} />
      <button disabled={enviando} className="rounded border px-3 py-1">
        {enviando ? "Salvando…" : "Adicionar horário"}
      </button>
      <p aria-live="polite" className={`w-full ${estado.erro ? "text-red-400" : ""}`}>
        {estado.erro ?? estado.mensagem}
      </p>
    </form>
  );
}

export function BotaoRemoverHorario({ horarioId, descricao }: { horarioId: string; descricao: string }) {
  const [estado, enviar, enviando] = useActionState(removerHorario, {});

  return (
    <form action={enviar} className="inline">
      <input type="hidden" name="horarioId" value={horarioId} />
      <button disabled={enviando} aria-label={`Remover ${descricao}`} className="rounded border px-2 text-sm">
        {enviando ? "…" : "Remover"}
      </button>
      {estado.erro && (
        <span role="alert" className="ml-2 text-sm text-red-400">
          {estado.erro}
        </span>
      )}
    </form>
  );
}

type Horario = { id: string; diaSemana: number; horaInicio: number; descricao: string };

const AvisoDaAgenda = createContext<(mensagem: string) => void>(() => {});

export function AvisosDaAgenda({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState("");
  return (
    <AvisoDaAgenda value={setMensagem}>
      <div className="flex flex-col gap-6">
        <p aria-live="polite" className={mensagem ? "" : "sr-only"}>
          {mensagem}
        </p>
        {children}
      </div>
    </AvisoDaAgenda>
  );
}

export function BotaoTrocarHorario({ horario, dias, horas }: { horario: Horario } & Grade) {
  const [aberto, setAberto] = useState(false);
  const avisar = useContext(AvisoDaAgenda);
  const [estado, enviar, enviando] = useActionState(async (anterior: EstadoAgenda, formData: FormData) => {
    const resultado = await trocarHorario(anterior, formData);
    if (resultado.mensagem) avisar(resultado.mensagem);
    return resultado;
  }, {});

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} aria-label={`Trocar ${horario.descricao}`} className="rounded border px-2 text-sm">
        Trocar
      </button>
    );
  }

  return (
    <form action={enviar} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="horarioId" value={horario.id} />
      <SeletoresHorario dias={dias} horas={horas} dia={horario.diaSemana} hora={horario.horaInicio} />
      <button disabled={enviando} className="rounded border px-2 text-sm">
        {enviando ? "Salvando…" : `Salvar troca de ${horario.descricao}`}
      </button>
      <button type="button" onClick={() => setAberto(false)} className="rounded border px-2 text-sm">
        Voltar
      </button>
      {estado.erro && (
        <span role="alert" className="text-sm text-red-400">
          {estado.erro}
        </span>
      )}
    </form>
  );
}

function SeletoresHorario({ dias, horas, dia, hora }: Grade & { dia?: number; hora?: number }) {
  return (
    <>
      <label className="flex flex-col gap-1">
        Dia
        <select name="diaSemana" required defaultValue={dia} className="rounded border bg-transparent px-2 py-1">
          {dias.map((opcao) => (
            <option key={opcao} value={opcao}>
              {DIAS_DA_SEMANA[opcao]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Horário
        <select name="horaInicio" required defaultValue={hora} className="rounded border bg-transparent px-2 py-1">
          {horas.map((opcao) => (
            <option key={opcao} value={opcao}>
              {formatarHora(opcao)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
