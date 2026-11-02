import { Suspense, type ReactNode } from "react";

type Props = {
  titulo?: string;
  card?: string;
  pendente?: string;
  carregando?: ReactNode;
  children: ReactNode;
};

export function PaginaModulo({ titulo, card, pendente, carregando = <p>Carregando…</p>, children }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {titulo && <h1 className="text-2xl font-bold">{titulo}</h1>}
      {card && pendente && (
        <p className="text-sm">
          Card {card} — a fazer: {pendente}
        </p>
      )}
      <Suspense fallback={carregando}>
        <div className="animate-in duration-300 ease-out fade-in motion-reduce:animate-none">{children}</div>
      </Suspense>
    </section>
  );
}
