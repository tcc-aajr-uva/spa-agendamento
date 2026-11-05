import type { ReactNode } from "react";

import { AtualizarAoFocar } from "../../atualizar-ao-focar";

export default function UsuariosLayout({ children }: { children: ReactNode }) {
  return <><AtualizarAoFocar />{children}</>;
}
