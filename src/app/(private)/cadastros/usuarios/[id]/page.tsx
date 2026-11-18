import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { DetalheUsuario } from "./detalhe-usuario";

type Props = {
  params: Promise<{ id: string }>;
};

export default function UsuarioPage({ params }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/usuarios" />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para usuários
      </Button>
      <Suspense fallback={<IndicadorCarregando texto="Carregando usuário…" />}>
        <ConteudoUsuario params={params} />
      </Suspense>
    </section>
  );
}

async function ConteudoUsuario({ params }: Props) {
  const { id } = await params;
  return <DetalheUsuario id={id} paginaCheia />;
}
