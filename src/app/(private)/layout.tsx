import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { BotaoSair } from "./botao-sair";
import { MENU } from "./menu";
import { Submenu } from "./submenu";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b p-4">
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
  return (
    <nav className="flex flex-wrap items-center gap-4">
      {MENU.filter((item) => item.perfis.includes(usuario.perfil)).map((item) => {
        const filhos = item.filhos?.filter((filho) => filho.perfis.includes(usuario.perfil));
        if (filhos?.length) {
          return (
            <Submenu
              key={item.href}
              rotulo={item.rotulo}
              itens={filhos.map(({ href, rotulo }) => ({
                href,
                rotulo,
                prefetch: href === "/cadastros/unidades" ? false : undefined,
              }))}
            />
          );
        }
        return (
          <Link key={item.href} href={item.href} className="underline">
            {item.rotulo}
          </Link>
        );
      })}
      <span className="ml-auto text-sm">
        {usuario.nome} ({rotuloDoPerfil(usuario.perfil)})
      </span>
      <BotaoSair />
    </nav>
  );
}
