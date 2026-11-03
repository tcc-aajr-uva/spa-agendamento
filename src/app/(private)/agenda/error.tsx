"use client";

import { ErroDeTela } from "../erro-de-tela";

export default function ErroAgenda({ reset }: { reset: () => void }) {
  return <ErroDeTela titulo="Não foi possível carregar sua agenda" reset={reset} />;
}
