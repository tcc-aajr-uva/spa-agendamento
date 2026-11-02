"use client";

export default function ErroPeriodos({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-4" role="alert">
      <h1 className="text-xl font-bold">Não foi possível carregar os períodos letivos</h1>
      <p>Tente novamente em instantes.</p>
      <button className="rounded border px-3 py-2" type="button" onClick={reset}>Tentar novamente</button>
    </section>
  );
}
