"use client";

import { useEffect } from "react";

import { toast } from "@/components/ui/toast";

type Props = {
  parametro: string;
  mensagem: string;
};

export function NotificacaoCadastroCriado({ parametro, mensagem }: Props) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(parametro) !== "1") return;

    url.searchParams.delete(parametro);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    toast.add({ title: mensagem, type: "success", timeout: 5_000 });
  }, [mensagem, parametro]);

  return null;
}
