"use client";

import { ErroDeTela } from "../erro-de-tela";

export default function ErroPacientes({ reset }: { reset: () => void }) {
  return <ErroDeTela titulo="Não foi possível carregar os pacientes" reset={reset} />;
}
