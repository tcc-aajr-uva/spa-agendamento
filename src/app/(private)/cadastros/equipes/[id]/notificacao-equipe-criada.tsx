"use client";

import { useEffect } from "react";

import { toast } from "@/components/ui/toast";

export function NotificacaoEquipeCriada() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("equipeCriada") !== "1") return;

    url.searchParams.delete("equipeCriada");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    toast.add({ title: "Equipe criada com sucesso", type: "success", timeout: 5_000 });
  }, []);

  return null;
}
