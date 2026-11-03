"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BotaoSair } from "./botao-sair";

type Destino = { href: string; rotulo: string; prefetch?: boolean };
export type ItemDoCabecalho = Destino & { filhos?: Destino[] };

type Props = {
  itens: ItemDoCabecalho[];
  usuario: { nome: string; perfil: string };
};

const ESTILO_ATIVO = "bg-accent text-accent-foreground hover:bg-accent focus:bg-accent data-active:bg-accent data-active:hover:bg-accent data-active:focus:bg-accent";

function estaAtivo(href: string, caminho: string): boolean {
  return caminho === href || caminho.startsWith(`${href}/`);
}

function Marca() {
  return (
    <Link href="/inicio" className="flex shrink-0 items-center gap-2 font-semibold">
      <span aria-hidden className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        S
      </span>
      SPA UVA
    </Link>
  );
}

function MenuDesktop({ itens, caminho }: { itens: ItemDoCabecalho[]; caminho: string }) {
  return (
    <NavigationMenu aria-label="Menu principal" className="hidden max-w-none justify-start lg:flex">
      <NavigationMenuList className="gap-1">
        {itens.map((item) => {
          const ativo = estaAtivo(item.href, caminho);
          if (item.filhos?.length) {
            return (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuTrigger className={cn(ativo && ESTILO_ATIVO)}>{item.rotulo}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex w-44 flex-col">
                    {item.filhos.map((filho) => (
                      <li key={filho.href}>
                        <NavigationMenuLink closeOnClick active={estaAtivo(filho.href, caminho)} render={<Link href={filho.href} prefetch={filho.prefetch} />}>
                          {filho.rotulo}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                active={ativo}
                className={cn(navigationMenuTriggerStyle(), ativo && ESTILO_ATIVO)}
                render={<Link href={item.href} prefetch={item.prefetch} />}
              >
                {item.rotulo}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function LinkDoCelular({ destino, caminho, recuado, aoNavegar }: { destino: Destino; caminho: string; recuado?: boolean; aoNavegar: () => void }) {
  const ativo = estaAtivo(destino.href, caminho);
  return (
    <Link
      href={destino.href}
      prefetch={destino.prefetch}
      aria-current={ativo ? "page" : undefined}
      onClick={aoNavegar}
      className={cn("flex h-9 items-center rounded-lg px-2.5 text-sm font-medium hover:bg-muted", recuado && "ml-3", ativo && ESTILO_ATIVO)}
    >
      {destino.rotulo}
    </Link>
  );
}

function MenuCelular({ itens, caminho, usuario }: Props & { caminho: string }) {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menu" className="ml-auto lg:hidden" />}>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent className="w-[300px]">
        <SheetHeader>
          <SheetTitle>{usuario.nome}</SheetTitle>
          <SheetDescription>{usuario.perfil}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal" className="flex flex-col gap-1 px-4">
          {itens.map((item) =>
            item.filhos?.length ? (
              <div key={item.href} className="flex flex-col gap-1">
                <p className="flex h-9 items-center px-2.5 text-sm font-medium text-muted-foreground">{item.rotulo}</p>
                {item.filhos.map((filho) => (
                  <LinkDoCelular key={filho.href} destino={filho} caminho={caminho} recuado aoNavegar={fechar} />
                ))}
              </div>
            ) : (
              <LinkDoCelular key={item.href} destino={item} caminho={caminho} aoNavegar={fechar} />
            ),
          )}
        </nav>
        <SheetFooter>
          <BotaoSair className="w-full" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function Cabecalho({ itens, usuario }: Props) {
  const caminho = usePathname();

  return (
    <>
      <Marca />
      <MenuDesktop itens={itens} caminho={caminho} />
      <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">
        <div className="text-right">
          <p className="text-sm font-medium">{usuario.nome}</p>
          <p className="text-xs text-muted-foreground">{usuario.perfil}</p>
        </div>
        <BotaoSair />
      </div>
      <MenuCelular itens={itens} caminho={caminho} usuario={usuario} />
    </>
  );
}
