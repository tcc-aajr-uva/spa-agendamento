"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { montarHref } from "../parametros";

type Props = {
  equipes: { value: string; label: string }[];
  atual: string;
  children: ReactNode;
};

export function SeletorDeEquipe({ equipes, atual, children }: Props) {
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  const [selecionada, selecionar] = useOptimistic(atual);

  const irPara = (equipe: string | null) => {
    if (!equipe || equipe === selecionada) return;
    iniciar(() => {
      selecionar(equipe);
      router.push(montarHref("/lista-espera", { equipe }), { scroll: false });
    });
  };

  return (
    <>
      {equipes.length > 1 && (
        <>
          <Tabs value={selecionada} onValueChange={(valor) => irPara(String(valor))} className="hidden md:flex">
            <TabsList aria-label="Equipe" className="h-auto! flex-wrap justify-start">
              {equipes.map((equipe) => (
                <TabsTrigger key={equipe.value} value={equipe.value} className="flex-none">
                  {equipe.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={selecionada} onValueChange={irPara} items={equipes}>
            <SelectTrigger aria-label="Equipe" className="w-full md:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {equipes.map((equipe) => (
                <SelectItem key={equipe.value} value={equipe.value}>
                  {equipe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
      <div
        aria-busy={carregando}
        className={cn("flex flex-col gap-4 transition-opacity duration-200 ease-out motion-reduce:transition-none", carregando && "opacity-60")}
      >
        {children}
      </div>
    </>
  );
}
