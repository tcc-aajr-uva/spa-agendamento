"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import { AlternarTema } from "@/components/alternar-tema";
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
  inicio: string;
  usuario: { nome: string; perfil: string };
};

const ESTILO_ATIVO = "bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground data-active:bg-primary data-active:hover:bg-primary/90 data-active:focus:bg-primary data-popup-open:bg-primary data-popup-open:hover:bg-primary/90";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ""}${partes.length > 1 ? partes[partes.length - 1][0] : ""}`.toUpperCase();
}

function estaAtivo(href: string, caminho: string): boolean {
  return caminho === href || caminho.startsWith(`${href}/`);
}

function Marca({ href }: { href: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5 rounded-xl pr-2 hover:opacity-85">
      <span aria-hidden className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-destaque-2 font-bold text-primary-foreground shadow-md shadow-primary/30">
        S
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-semibold">SPA UVA</span>
        <span className="hidden text-xs text-muted-foreground sm:block">Psicologia Aplicada</span>
      </span>
    </Link>
  );
}

function MenuDesktop({ itens, caminho }: { itens: ItemDoCabecalho[]; caminho: string }) {
  return (
    <NavigationMenu aria-label="Menu principal" className="hidden max-w-none justify-start xl:flex">
      <NavigationMenuList className="gap-1">
        {itens.map((item) => {
          const ativo = estaAtivo(item.href, caminho);
          if (item.filhos?.length) {
            return (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuTrigger className={cn("rounded-full px-3.5", ativo && ESTILO_ATIVO)}>{item.rotulo}</NavigationMenuTrigger>
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
                className={cn(navigationMenuTriggerStyle(), "rounded-full px-3.5", ativo && ESTILO_ATIVO)}
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

function MenuCelular({ itens, caminho, usuario }: Omit<Props, "inicio"> & { caminho: string }) {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menu" className="xl:hidden" />}>
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

export function Cabecalho({ itens, inicio, usuario }: Props) {
  const caminho = usePathname();

  return (
    <>
      <Marca href={inicio} />
      <MenuDesktop itens={itens} caminho={caminho} />
      <div className="ml-auto hidden shrink-0 items-center gap-3 xl:flex">
        <AlternarTema />
        <span aria-hidden className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
            {iniciais(usuario.nome)}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground">{usuario.perfil}</p>
          </div>
        </div>
        <BotaoSair />
      </div>
      <div className="ml-auto flex items-center gap-1 xl:hidden">
        <AlternarTema />
        <MenuCelular itens={itens} caminho={caminho} usuario={usuario} />
      </div>
    </>
  );
}
