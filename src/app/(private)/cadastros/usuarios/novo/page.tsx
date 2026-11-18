import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Button } from "@/components/ui/button";
import { ConteudoNovoUsuario } from "./conteudo-novo-usuario";

export default function NovoUsuarioPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/usuarios" />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar para usuários
        </Button>
        <h1 className="text-2xl font-bold">Novo usuário</h1>
      </div>

      <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
        <ConteudoNovoUsuario />
      </Suspense>
    </section>
  );
}
