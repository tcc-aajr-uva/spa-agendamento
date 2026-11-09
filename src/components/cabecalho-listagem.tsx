import type { ReactNode } from "react";

type Props = {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
};

export function CabecalhoListagem({ titulo, descricao, acao }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>
      {acao}
    </div>
  );
}
