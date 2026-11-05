"use client";

import { useId } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OpcaoVinculoUsuario = { id: string; unidadeId: string; nome: string; disponivel: boolean };

export function CampoVinculosUsuario({ opcoes, vinculos, tipo, mesmaUnidade, bloqueado, erro, aoAlterar }: {
  opcoes: OpcaoVinculoUsuario[];
  vinculos: string[];
  tipo: "unidadeIds" | "equipeIds";
  mesmaUnidade: boolean;
  bloqueado: boolean;
  erro?: string;
  aoAlterar: (ids: string[]) => void;
}) {
  const id = useId();
  const unidade = opcoes.find((opcao) => vinculos.includes(opcao.id))?.unidadeId;
  const itens = opcoes.filter((opcao) =>
    opcao.disponivel && !vinculos.includes(opcao.id) && (!mesmaUnidade || !unidade || opcao.unidadeId === unidade),
  ).map((opcao) => ({ value: opcao.id, label: opcao.nome }));

  return (
    <>
      <Field data-invalid={!!erro}>
        <FieldLabel htmlFor={id}>Adicionar vínculo</FieldLabel>
        <Select disabled={bloqueado || itens.length === 0} items={itens} value=""
          onValueChange={(valor) => { if (valor) aoAlterar([...vinculos, valor]); }}>
          <SelectTrigger id={id} aria-invalid={!!erro} aria-describedby={erro ? `${id}-erro` : undefined}
            className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
            <SelectValue placeholder="Selecione para adicionar" />
          </SelectTrigger>
          <SelectContent>
            {itens.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <FieldError id={`${id}-erro`}>{erro}</FieldError>
      </Field>
      <div className="space-y-2">
        {vinculos.map((vinculo) => {
          const nome = opcoes.find((opcao) => opcao.id === vinculo)?.nome ?? "Vínculo indisponível";
          return (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2" key={vinculo}>
              <input name={tipo} type="hidden" value={vinculo} />
              <span className="text-sm font-medium">{nome}</span>
              <Button aria-label={`Remover ${nome}`} size="sm" variant="ghost" disabled={bloqueado}
                onClick={() => aoAlterar(vinculos.filter((item) => item !== vinculo))} type="button">
                <XIcon aria-hidden="true" /> Remover
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
