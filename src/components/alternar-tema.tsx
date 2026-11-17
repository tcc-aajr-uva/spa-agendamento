"use client";

import { cn } from "cn";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AlternarTema({ className }: { className?: string }) {
  function alternar() {
    const escuro = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("tema", escuro ? "escuro" : "claro");
    } catch {
      return;
    }
  }

  return (
    <Button variant="outline" size="icon" aria-label="Alternar tema claro e escuro" title="Alternar tema" className={cn("bg-background/80 backdrop-blur-sm", className)} onClick={alternar}>
      <MoonIcon className="transition-transform duration-300 ease-out dark:hidden" />
      <SunIcon className="hidden animate-in duration-300 ease-out spin-in-90 dark:block" />
    </Button>
  );
}
