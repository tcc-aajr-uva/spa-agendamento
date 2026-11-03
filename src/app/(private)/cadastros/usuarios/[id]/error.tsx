"use client";

export default function ErroUsuario({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-4" role="alert">
      <h1 className="text-xl font-bold">Não foi possível carregar o usuário</h1>
      <p>Tente novamente em instantes.</p>
      <button className="rounded border px-3 py-2" onClick={reset} type="button">Tentar novamente</button>
    </section>
  );
}
