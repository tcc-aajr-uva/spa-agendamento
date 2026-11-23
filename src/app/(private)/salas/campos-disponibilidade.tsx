"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DIAS_DA_SEMANA, DIAS_EXIBIDOS, formatarHora } from "@/lib/agendamento/regras";
import { CampoSelect } from "../campo-select";

type Modo = "INTERVALO" | "HORARIOS";

type Props = { idBase: string; horas: number[]; duracaoBlocoMin: number };

export function CamposDisponibilidade({ idBase, horas, duracaoBlocoMin }: Props) {
  const [modo, setModo] = useState<Modo>("INTERVALO");
  const opcoesInicio = horas.map((hora) => ({ value: String(hora), label: formatarHora(hora) }));
  const opcoesFim = horas.map((hora) => ({ value: String(hora + duracaoBlocoMin), label: formatarHora(hora + duracaoBlocoMin) }));

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="modo" value={modo} />
      <FieldSet>
        <FieldLegend variant="label">Dias</FieldLegend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DIAS_EXIBIDOS.map((dia) => (
            <Field key={dia} orientation="horizontal">
              <Checkbox id={`${idBase}-dia-${dia}`} name="dias" value={String(dia)} />
              <FieldLabel htmlFor={`${idBase}-dia-${dia}`}>{DIAS_DA_SEMANA[dia].slice(0, 3)}</FieldLabel>
            </Field>
          ))}
        </div>
      </FieldSet>
      <Tabs value={modo} onValueChange={(valor) => setModo(valor as Modo)}>
        <TabsList aria-label="Forma de cadastrar">
          <TabsTrigger value="INTERVALO">Intervalo</TabsTrigger>
          <TabsTrigger value="HORARIOS">Horários específicos</TabsTrigger>
        </TabsList>
      </Tabs>
      {modo === "INTERVALO" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoSelect id={`${idBase}-inicio`} nome="horaInicio" rotulo="Das" opcoes={opcoesInicio} obrigatorio />
          <CampoSelect id={`${idBase}-fim`} nome="horaFim" rotulo="Até" opcoes={opcoesFim} valor={opcoesFim.at(-1)?.value} obrigatorio />
        </div>
      ) : (
        <FieldSet>
          <FieldLegend variant="label">Horários</FieldLegend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {horas.map((hora) => (
              <Field key={hora} orientation="horizontal">
                <Checkbox id={`${idBase}-hora-${hora}`} name="horarios" value={String(hora)} />
                <FieldLabel htmlFor={`${idBase}-hora-${hora}`} className="tabular-nums">
                  {formatarHora(hora)}
                </FieldLabel>
              </Field>
            ))}
          </div>
        </FieldSet>
      )}
    </div>
  );
}
