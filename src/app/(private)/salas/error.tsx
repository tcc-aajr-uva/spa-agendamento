"use client";

import { ErroDeTela } from "../erro-de-tela";

export default function ErroSalas({ reset }: { reset: () => void }) {
  return <ErroDeTela titulo="Não foi possível carregar as salas" reset={reset} />;
}
