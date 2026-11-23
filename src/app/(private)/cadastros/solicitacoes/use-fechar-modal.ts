"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useFecharModal(parametro: string) {
  const router = useRouter();
  const caminho = usePathname();
  const busca = useSearchParams();

  return () => {
    const parametros = new URLSearchParams(busca.toString());
    parametros.delete(parametro);
    const consulta = parametros.toString();
    router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
  };
}
