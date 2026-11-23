import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-destaque-2 text-2xl font-bold text-primary-foreground shadow-md shadow-primary/30">
          S
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-2xl font-bold tracking-tight sm:text-3xl">SPA UVA</span>
          <span className="text-sm text-muted-foreground">Serviço de Psicologia Aplicada</span>
        </span>
      </header>

      <section className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Agenda de atendimentos e salas</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Sistema interno do Serviço de Psicologia Aplicada da Universidade Veiga de Almeida. Supervisores designam os pacientes, e os
            estagiários marcam o horário e a sala de cada atendimento.
          </p>
        </div>
        <Button size="lg" className="h-12 gap-2 self-start px-5 text-base" nativeButton={false} render={<Link href="/entrar" />}>
          <LogIn className="size-5" />
          Área interna
        </Button>
      </section>
    </main>
  );
}
