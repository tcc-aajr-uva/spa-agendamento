import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { consultarEstadoConvite, type EstadoConvite } from "@/lib/usuario/consultar-convite";
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
          <h1 className="text-2xl font-bold">Convite de acesso</h1>
          <p className="text-sm text-gray-600">Consulte o convite e, quando disponível, defina sua senha.</p>
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
  await connection();
  const estado = await consultarEstadoConvite(token, new Date());
  if (estado !== "VALIDO") return <ConviteIndisponivel estado={estado} />;
  return <FormularioConvite acao={aceitarConvite.bind(null, token)} />;
}

function ConviteIndisponivel({ estado }: { estado: Exclude<EstadoConvite, "VALIDO"> }) {
  if (estado === "USADO") {
    return (
      <div className="space-y-3 rounded border p-4">
        <p>Este convite já foi utilizado.</p>
        <Link className="inline-block rounded border px-3 py-2" href="/entrar">
          Ir para o login
        </Link>
      </div>
    );
  }

  if (estado === "EXPIRADO") {
    return (
      <div className="space-y-3 rounded border p-4">
        <p>Este convite expirou.</p>
        <p className="text-sm text-gray-600">Solicite um novo link à pessoa responsável pelo seu cadastro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded border p-4">
      <p>Este convite não está disponível.</p>
      <p className="text-sm text-gray-600">Verifique o link recebido ou solicite um novo convite.</p>
    </div>
  );
}
