import Link from "next/link";

export default function UnidadeNaoEncontrada() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Unidade não encontrada</h1>
      <p>A unidade não existe ou não pertence ao seu escopo de atuação.</p>
      <Link className="underline" href="/cadastros/unidades" prefetch={false}>Voltar para unidades</Link>
    </section>
  );
}
