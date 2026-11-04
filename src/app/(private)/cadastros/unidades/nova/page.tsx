import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { criarUnidade } from "../actions";
import { FormularioUnidade } from "../formulario-unidade";
import { VALORES_PADRAO_UNIDADE } from "../formulario-unidade-schema";

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
      <Suspense fallback={<p>Carregando formulário…</p>}>
        <ConteudoNovaUnidade />
      </Suspense>
    </section>
  );
}

async function ConteudoNovaUnidade() {
  await exigirUsuario(["ADMINISTRADOR"]);
  return <FormularioUnidade acao={criarUnidade} rotuloBotao="Criar unidade" valores={VALORES_PADRAO_UNIDADE} />;
}
