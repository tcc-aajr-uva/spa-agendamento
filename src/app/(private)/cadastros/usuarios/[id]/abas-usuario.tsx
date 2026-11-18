"use client";

import type { ReactNode } from "react";

import { AbasCadastro } from "@/components/abas-cadastro";

type Props = {
  dados: ReactNode;
  convite: ReactNode;
  bloqueada: boolean;
};

export function AbasUsuario({ dados, convite, bloqueada }: Props) {
  return (
    <AbasCadastro
      abaPadrao="dados"
      rotulo="Cadastro do usuário"
      bloqueada={bloqueada}
      abas={[
        { valor: "dados", rotulo: "Dados do usuário", conteudo: dados, className: "space-y-6" },
        { valor: "convite", rotulo: "Convite", conteudo: convite },
      ]}
    />
  );
}
