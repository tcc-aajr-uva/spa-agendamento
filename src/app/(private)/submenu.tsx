"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";

type Props = {
  rotulo: string;
  itens: { href: string; rotulo: string }[];
};

export function Submenu({ rotulo, itens }: Props) {
  const detalhes = useRef<HTMLDetailsElement>(null);
  const fechar = useCallback(() => detalhes.current?.removeAttribute("open"), []);

  useEffect(() => {
    const fecharAoClicarFora = (evento: PointerEvent) => {
      if (detalhes.current && !detalhes.current.contains(evento.target as Node)) fechar();
    };
    const fecharComEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [fechar]);

  return (
    <details className="relative" ref={detalhes}>
      <summary className="cursor-pointer underline">{rotulo}</summary>
      <div className="absolute left-0 z-10 mt-2 flex min-w-40 flex-col gap-2 rounded border bg-white p-3 text-black shadow">
        {itens.map((item) => (
          <Link key={item.href} href={item.href} className="underline" onClick={fechar}>
            {item.rotulo}
          </Link>
        ))}
      </div>
    </details>
  );
}
