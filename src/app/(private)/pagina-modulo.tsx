import { Suspense, type ReactNode } from "react";

type Props = {
  titulo: string;
  card: string;
  pendente: string;
  children: ReactNode;
};

export function PaginaModulo({ titulo, card, pendente, children }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="text-sm">
        Card {card} — a fazer: {pendente}
      </p>
      <Suspense fallback={<p>Carregando…</p>}>{children}</Suspense>
    </section>
  );
}
