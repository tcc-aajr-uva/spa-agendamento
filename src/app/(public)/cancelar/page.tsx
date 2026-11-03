import { Suspense } from "react";
import { FormularioCancelamento } from "./formulario-cancelamento";
import { TAMANHO_TOKEN } from "@/lib/token-constantes";

export const metadata = { referrer: "no-referrer" };
type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default function CancelarPage({ searchParams }: Props) {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Cancelar agendamento</h1>
      <Suspense fallback={<p className="mt-4">Carregando…</p>}>
        <ConteudoCancelamento searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ConteudoCancelamento({ searchParams }: Props) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length !== TAMANHO_TOKEN) {
    return <p className="mt-4">Link de cancelamento inválido. Use o link exibido ao final do seu agendamento.</p>;
  }
  return <FormularioCancelamento token={token} />;
}