"use client";

import { createContext, type ReactNode, useActionState, useContext, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { CampoSelect } from "../campo-select";
import { type EstadoAgenda, trocarHorario } from "./actions";

type Grade = { dias: number[]; horas: number[] };

type Horario = { id: string; diaSemana: number; horaInicio: number; descricao: string };

const AvisoDaAgenda = createContext<(mensagem: string) => void>(() => {});

export function AvisosDaAgenda({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState("");
  return (
    <AvisoDaAgenda value={setMensagem}>
      <div className="flex flex-col gap-6">
        <div aria-live="polite">
          {mensagem && (
            <Alert variant="success">
              <AlertDescription>{mensagem}</AlertDescription>
            </Alert>
          )}
        </div>
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
      <Button variant="outline" size="sm" onClick={() => setAberto(true)} aria-label={`Trocar ${horario.descricao}`}>
        Trocar
      </Button>
    );
  }

  return (
    <div className="order-last basis-full pt-2">
      <form action={enviar} className="flex flex-col gap-3">
        <input type="hidden" name="horarioId" value={horario.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SeletoresHorario id={`trocar-${horario.id}`} dias={dias} horas={horas} dia={horario.diaSemana} hora={horario.horaInicio} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar troca"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAberto(false)}>
            Voltar
          </Button>
        </div>
        {estado.erro && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription className="text-destructive">{estado.erro}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}

export function SeletoresHorario({ id, dias, horas, dia, hora }: Grade & { id: string; dia?: number; hora?: number }) {
  return (
    <>
      <CampoSelect
        id={`${id}-dia`}
        nome="diaSemana"
        rotulo="Dia"
        opcoes={dias.map((opcao) => ({ value: String(opcao), label: DIAS_DA_SEMANA[opcao] }))}
        valor={dia === undefined ? undefined : String(dia)}
        obrigatorio
      />
      <CampoSelect
        id={`${id}-hora`}
        nome="horaInicio"
        rotulo="Horário"
        opcoes={horas.map((opcao) => ({ value: String(opcao), label: formatarHora(opcao) }))}
        valor={hora === undefined ? undefined : String(hora)}
        obrigatorio
      />
    </>
  );
}
