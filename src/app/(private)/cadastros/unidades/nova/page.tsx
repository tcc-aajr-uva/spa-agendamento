import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConteudoNovaUnidade } from "./conteudo-nova-unidade";
import { IndicadorCarregando } from "@/components/indicador-carregando";

export default function NovaUnidadePage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/unidades" prefetch={false} />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar para unidades
        </Button>
        <h1 className="text-2xl font-bold">Nova unidade</h1>
        <p className="text-sm text-muted-foreground">Cadastre a unidade e defina suas regras de agendamento.</p>
      </div>
      <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
        <ConteudoNovaUnidade />
      </Suspense>
    </section>
  );
}
