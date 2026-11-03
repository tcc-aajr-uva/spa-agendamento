"use client";

import { useEffect } from "react";

import { toast } from "@/components/ui/toast";

export function NotificacaoUnidadeCriada() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("unidadeCriada") !== "1") return;

    url.searchParams.delete("unidadeCriada");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    toast.add({ title: "Unidade criada com sucesso", type: "success", timeout: 5_000 });
  }, []);

  return null;
}
