import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { DetalheEquipe } from "./detalhe-equipe";

type Props = { params: Promise<{ id: string }> };

export default function EquipePage({ params }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/equipes" prefetch={false} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para equipes
      </Button>
      <Suspense fallback={<IndicadorCarregando texto="Carregando equipe…" />}>
        <Conteudo params={params} />
      </Suspense>
    </section>
  );
}

async function Conteudo({ params }: Props) {
  const { id } = await params;
  return <DetalheEquipe id={id} paginaCheia />;
}
