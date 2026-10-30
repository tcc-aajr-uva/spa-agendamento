import { Suspense } from "react";

import { aceitarConvite } from "./actions";
import { FormularioConvite } from "./formulario-convite";

type Props = {
  params: Promise<{ token: string }>;
};

export default function ConvitePage({ params }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <section className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Criar senha</h1>
          <p className="text-sm text-gray-600">Defina a senha que será usada para acessar o sistema.</p>
        </div>
        <Suspense fallback={<p>Carregando…</p>}>
          <ConteudoConvite params={params} />
        </Suspense>
      </section>
    </main>
  );
}

async function ConteudoConvite({ params }: Props) {
  const { token } = await params;
  return <FormularioConvite acao={aceitarConvite.bind(null, token)} />;
}
