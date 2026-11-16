import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { perfisDaRota } from "../../../menu";
import { criarUsuario } from "../actions";
import { FormularioUsuario } from "../formulario-usuario";

export default function NovoUsuarioPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/usuarios" />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar para usuários
        </Button>
        <h1 className="text-2xl font-bold">Novo usuário</h1>
        <p className="text-sm text-muted-foreground">Cadastre a pessoa e gere o link para definição da senha.</p>
      </div>

      <Suspense fallback={<p>Carregando formulário…</p>}>
        <NovoUsuario />
      </Suspense>
    </section>
  );
}

async function NovoUsuario() {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const perfis = perfisCriadosPor(autor.perfil);
  if (perfis.length === 0) return null;

  const configuracoes = await Promise.all(
    perfis.map(async (perfil) => ({
      perfil,
      ...await listarOpcoesDeVinculo(autor, perfil),
    })),
  );

  return <FormularioUsuario acao={criarUsuario} configuracoes={configuracoes} exigeEquipe={autor.perfil === "SUPERVISOR"} />;
}
