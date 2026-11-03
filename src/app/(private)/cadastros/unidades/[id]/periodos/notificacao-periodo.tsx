"use client";

import { useEffect } from "react";

import { toast } from "@/components/ui/toast";

type Props = {
  parametro: "periodoSalvo" | "excluido";
  periodoId: string;
  confirmacao: string;
};

export function NotificacaoPeriodo({ parametro, periodoId, confirmacao }: Props) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(parametro) !== periodoId || (url.searchParams.get("confirmacaoPeriodo") ?? "") !== confirmacao) return;

    url.searchParams.delete("periodoSalvo");
    url.searchParams.delete("excluido");
    url.searchParams.delete("confirmacaoPeriodo");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    toast.add({
      title: parametro === "periodoSalvo" ? "Período letivo salvo com sucesso" : "Período letivo excluído com sucesso",
      type: "success",
      timeout: 5_000,
    });
  }, [parametro, periodoId, confirmacao]);

  return null;
}
