import Link from "next/link";

export default function EquipeNaoEncontrada() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Equipe não encontrada</h1>
      <p>A equipe não existe ou não pertence ao seu escopo de atuação.</p>
      <Link href="/cadastros/equipes" className="underline" prefetch={false}>Voltar para equipes</Link>
    </section>
  );
}
