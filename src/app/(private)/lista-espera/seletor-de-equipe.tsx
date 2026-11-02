"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { montarHref } from "../parametros";

type Props = {
  equipes: { value: string; label: string }[];
  atual: string;
};

export function SeletorDeEquipe({ equipes, atual }: Props) {
  const router = useRouter();
  const irPara = (equipe: string | null) => {
    if (equipe) router.push(montarHref("/lista-espera", { equipe }));
  };

  return (
    <>
      <Tabs value={atual} onValueChange={(valor) => irPara(String(valor))} className="hidden md:flex">
        <TabsList aria-label="Equipe" className="h-auto! flex-wrap justify-start">
          {equipes.map((equipe) => (
            <TabsTrigger key={equipe.value} value={equipe.value} className="flex-none">
              {equipe.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Select value={atual} onValueChange={irPara} items={equipes}>
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
  );
}
