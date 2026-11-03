"use client";

import { ErroDeTela } from "../erro-de-tela";

export default function ErroListaEspera({ reset }: { reset: () => void }) {
  return <ErroDeTela titulo="Não foi possível carregar a lista de espera" reset={reset} />;
}
