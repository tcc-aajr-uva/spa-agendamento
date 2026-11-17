"use client";

import { useEffect } from "react";

export function MonitorDeRolagem() {
  useEffect(() => {
    const html = document.documentElement;
    const atualizar = () => html.toggleAttribute("data-rola", html.scrollHeight > html.clientHeight);
    const observador = new ResizeObserver(atualizar);
    observador.observe(document.body);
    window.addEventListener("resize", atualizar);
    atualizar();
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", atualizar);
    };
  }, []);

  return null;
}
