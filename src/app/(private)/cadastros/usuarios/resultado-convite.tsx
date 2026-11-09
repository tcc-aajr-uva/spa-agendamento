"use client";

import { CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartaoLinkConvite } from "./cartao-link-convite";

type Props = {
  expiraEm: string;
  linkConvite: string;
  cadastrarOutro: () => void;
  voltarParaLista: () => void;
};

export function ResultadoConvite({ expiraEm, linkConvite, cadastrarOutro, voltarParaLista }: Props) {
  return (
    <CartaoLinkConvite
      key={linkConvite}
      className="sm:[--card-spacing:--spacing(6)]"
      classNameConteudo="space-y-4"
      titulo={<><CircleCheckIcon aria-hidden="true" /> Usuário criado</>}
      descricao="Compartilhe o link abaixo para que a pessoa defina sua senha."
      linkConvite={linkConvite}
      validade={<>O convite poderá ser usado uma única vez e expira em {formatarData(expiraEm)}.</>}
      acoes={
        <>
          <Button variant="outline" type="button" onClick={cadastrarOutro}>Cadastrar outro</Button>
          <Button type="button" onClick={voltarParaLista}>Voltar à lista</Button>
        </>
      }
    />
  );
}

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}
