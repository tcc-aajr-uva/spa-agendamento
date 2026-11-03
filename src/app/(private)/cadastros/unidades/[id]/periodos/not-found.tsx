import Link from "next/link";

export default function PeriodoNaoEncontrado() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Unidade ou período não encontrado</h1>
      <p>O registro não existe ou não pertence ao seu escopo de atuação.</p>
      <Link className="underline" prefetch={false} href="/cadastros/periodos">Voltar para unidades dos períodos letivos</Link>
    </section>
  );
}
