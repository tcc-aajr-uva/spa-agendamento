import { Suspense } from "react";
import { redirect } from "next/navigation";

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
  const { id } = await params;
  return redirect(`/cadastros/usuarios/${encodeURIComponent(id)}#convite`);
}
