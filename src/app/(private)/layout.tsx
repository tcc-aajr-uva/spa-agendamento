import { Suspense, type ReactNode } from "react";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { rotaInicialDoPerfil } from "@/lib/auth/rota-inicial";
import { FundoAbstrato } from "@/components/fundo-abstrato";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { Cabecalho } from "./cabecalho";
import { MENU } from "./menu";
import { IndicadorCarregando } from "@/components/indicador-carregando";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <FundoAbstrato />
      <div className="sticky top-0 z-30 px-3 pt-3 lg:px-6">
        <header className="relative mx-auto flex min-h-15 max-w-7xl items-center gap-4 rounded-2xl border border-border/70 bg-background/75 px-3 py-2 shadow-lg shadow-primary/10 backdrop-blur-xl animate-in duration-500 ease-out fade-in slide-in-from-top-2 after:pointer-events-none after:absolute after:inset-x-8 after:-bottom-px after:h-px after:bg-linear-to-r after:from-transparent after:via-primary/50 after:to-transparent lg:gap-6 lg:px-4">
          <Suspense fallback={<IndicadorCarregando />}>
            <Navegacao />
          </Suspense>
        </header>
      </div>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

async function Navegacao() {
  const usuario = await exigirUsuario();
  const itens = MENU.filter((item) => item.perfis.includes(usuario.perfil)).map(({ href, rotulo, prefetch, filhos }) => ({
    href,
    rotulo,
    prefetch,
    filhos: filhos
      ?.filter((filho) => filho.perfis.includes(usuario.perfil))
      .map((filho) => ({ href: filho.href, rotulo: filho.rotulo, prefetch: filho.prefetch })),
  }));

  return <Cabecalho itens={itens} inicio={rotaInicialDoPerfil(usuario.perfil)} usuario={{ nome: usuario.nome, perfil: rotuloDoPerfil(usuario.perfil) }} />;
}
