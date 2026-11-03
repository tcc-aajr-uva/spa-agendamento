import { Suspense, type ReactNode } from "react";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { Cabecalho } from "./cabecalho";
import { MENU } from "./menu";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex min-h-[61px] items-center gap-6 border-b bg-background px-4 py-3 lg:px-8">
        <Suspense fallback={<span>Carregando…</span>}>
          <Navegacao />
        </Suspense>
      </header>
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

  return <Cabecalho itens={itens} usuario={{ nome: usuario.nome, perfil: rotuloDoPerfil(usuario.perfil) }} />;
}
