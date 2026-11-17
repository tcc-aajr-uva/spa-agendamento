import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { DetalheUnidade } from "./detalhe-unidade";
import type { ParametrosPeriodos } from "./periodos/secao-periodos";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<ParametrosPeriodos> };

export default function UnidadePage({ params, searchParams }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/unidades" prefetch={false} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para unidades
      </Button>
      <Suspense fallback={<IndicadorCarregando texto="Carregando unidade…" />}>
        <ConteudoUnidade params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ConteudoUnidade({ params, searchParams }: Props) {
  const { id } = await params;
  return <DetalheUnidade id={id} caminhoLista={`/cadastros/unidades/${id}`} searchParams={searchParams} paginaCheia />;
}
