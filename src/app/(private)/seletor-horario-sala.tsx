"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OpcaoDeHorario } from "@/lib/agendamento/opcoes-de-horario";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";

type Opcao = { value: string; label: string };

type Props = { idBase: string; opcoes: OpcaoDeHorario[] };

const PREFERENCIA = " · preferência";

export function SeletorHorarioSala({ idBase, opcoes }: Props) {
  const dias = [...new Set(opcoes.map((opcao) => opcao.diaSemana))];
  const [diaEscolhido, setDia] = useState<number>();
  const [horaEscolhida, setHora] = useState<number>();
  const [salaEscolhida, setSala] = useState<string>();

  const dia = diaEscolhido ?? preferidaOuPrimeira(opcoes)?.diaSemana ?? dias[0];
  const doDia = opcoes.filter((opcao) => opcao.diaSemana === dia);
  const horario = doDia.find((opcao) => opcao.horaInicio === horaEscolhida) ?? preferidaOuPrimeira(doDia);
  const sala = horario?.salas.find((candidata) => candidata.id === salaEscolhida) ?? horario?.salas[0];

  if (!horario || !sala) return null;

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="diaSemana" value={horario.diaSemana} />
      <input type="hidden" name="horaInicio" value={horario.horaInicio} />
      <input type="hidden" name="salaId" value={sala.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Escolha
          id={`${idBase}-dia`}
          rotulo="Dia"
          valor={String(dia)}
          opcoes={dias.map((opcao) => ({
            value: String(opcao),
            label: `${DIAS_DA_SEMANA[opcao]}${opcoes.some((item) => item.diaSemana === opcao && item.preferido) ? PREFERENCIA : ""}`,
          }))}
          aoMudar={(valor) => {
            setDia(Number(valor));
            setHora(undefined);
            setSala(undefined);
          }}
        />
        <Escolha
          id={`${idBase}-hora`}
          rotulo="Horário"
          valor={String(horario.horaInicio)}
          opcoes={doDia.map((opcao) => ({ value: String(opcao.horaInicio), label: `${formatarHora(opcao.horaInicio)}${opcao.preferido ? PREFERENCIA : ""}` }))}
          aoMudar={(valor) => {
            setHora(Number(valor));
            setSala(undefined);
          }}
        />
        <Escolha
          id={`${idBase}-sala`}
          rotulo="Sala"
          valor={sala.id}
          opcoes={horario.salas.map((opcao) => ({ value: opcao.id, label: opcao.nome }))}
          aoMudar={setSala}
        />
      </div>
      <FieldDescription>Só aparecem horários com sala disponível e livre. &quot;Preferência&quot; marca os turnos da sua agenda.</FieldDescription>
    </div>
  );
}

function preferidaOuPrimeira(opcoes: OpcaoDeHorario[]): OpcaoDeHorario | undefined {
  return opcoes.find((opcao) => opcao.preferido) ?? opcoes[0];
}

function Escolha({ id, rotulo, valor, opcoes, aoMudar }: { id: string; rotulo: string; valor: string; opcoes: Opcao[]; aoMudar: (valor: string) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Select items={opcoes} value={valor} onValueChange={(novo) => novo !== null && aoMudar(String(novo))}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
