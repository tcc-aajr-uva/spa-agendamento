"use client";

import type { ReactNode } from "react";

import { AbasCadastro } from "@/components/abas-cadastro";

type Props = {
  dados: ReactNode;
  atendimento?: ReactNode;
  convite: ReactNode;
  bloqueada: boolean;
};

export function AbasUsuario({ dados, atendimento, convite, bloqueada }: Props) {
  const temAtendimento = atendimento !== undefined && atendimento !== null;
  return (
    <AbasCadastro
      abaPadrao="dados"
      rotulo="Cadastro do usuário"
      bloqueada={bloqueada}
      abas={[
        { valor: "dados", rotulo: "Dados do usuário", conteudo: dados, className: "space-y-6" },
        ...(temAtendimento ? [{ valor: "atendimento", rotulo: "Atendimento", conteudo: atendimento, alertas: true }] : []),
        { valor: "convite", rotulo: "Convite", conteudo: convite },
      ]}
    />
  );
}
