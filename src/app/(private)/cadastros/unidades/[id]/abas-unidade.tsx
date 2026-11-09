"use client";

import type { ReactNode } from "react";

import { AbasCadastro } from "@/components/abas-cadastro";

type Props = {
  bloqueada: boolean;
  dados: ReactNode;
  periodos: ReactNode;
};

export function AbasUnidade({ bloqueada, dados, periodos }: Props) {
  return (
    <AbasCadastro
      abaPadrao="dados"
      rotulo="Cadastro da unidade"
      bloqueada={bloqueada}
      abas={[
        { valor: "dados", rotulo: "Dados da unidade", conteudo: dados, className: "space-y-6" },
        { valor: "periodos", rotulo: "Períodos letivos", conteudo: periodos },
      ]}
    />
  );
}
