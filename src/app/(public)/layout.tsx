import type { ReactNode } from "react";
import { AlternarTema } from "@/components/alternar-tema";
import { FundoAbstrato } from "@/components/fundo-abstrato";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FundoAbstrato />
      <AlternarTema className="fixed top-3 right-3 z-40" />
      {children}
    </>
  );
}
