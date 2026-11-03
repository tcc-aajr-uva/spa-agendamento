import { Suspense } from "react";
import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { perfisDaRota } from "../../../../menu";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ConvitesUsuarioPage({ params }: Props) {
  return (
    <Suspense fallback={<p>Redirecionando para o convite…</p>}>
      <RedirecionarParaConvite params={params} />
    </Suspense>
  );
}

async function RedirecionarParaConvite({ params }: Props) {
  await exigirUsuario(perfisDaRota("/cadastros"));
  const { id } = await params;
  return redirect(`/cadastros/usuarios/${encodeURIComponent(id)}#convite`);
}
