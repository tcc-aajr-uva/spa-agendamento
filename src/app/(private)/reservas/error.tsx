"use client";

import { ErroDeTela } from "../erro-de-tela";

export default function ErroReservas({ reset }: { reset: () => void }) {
  return <ErroDeTela titulo="Não foi possível carregar suas reservas" reset={reset} />;
}
