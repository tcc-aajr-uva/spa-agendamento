import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UsuarioNaoEncontrado() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-3">
      <h1 className="text-2xl font-bold">Usuário indisponível</h1>
      <p className="text-muted-foreground">O usuário não existe ou não pertence ao seu escopo de atuação.</p>
      <Button variant="outline" nativeButton={false} render={<Link href="/cadastros/usuarios" />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para usuários
      </Button>
    </section>
  );
}
