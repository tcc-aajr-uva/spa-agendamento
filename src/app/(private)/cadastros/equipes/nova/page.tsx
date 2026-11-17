import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConteudoNovaEquipe } from "./conteudo-nova-equipe";
import { IndicadorCarregando } from "@/components/indicador-carregando";

export default function NovaEquipePage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/equipes" prefetch={false} />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar para equipes
        </Button>
        <h1 className="text-2xl font-bold">Nova equipe</h1>
        <p className="text-sm text-muted-foreground">Cadastre a equipe e defina sua unidade e supervisão responsável.</p>
      </div>
      <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
        <ConteudoNovaEquipe />
      </Suspense>
    </section>
  );
}
