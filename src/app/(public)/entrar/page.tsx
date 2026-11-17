import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { FundoAbstrato } from "@/components/fundo-abstrato";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioLogin } from "./formulario-login";

export default function EntrarPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6 text-destaque-foreground">
      <FundoAbstrato variante="destaque" />
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        className="self-start text-destaque-foreground hover:bg-destaque-foreground/10 hover:text-destaque-foreground"
        render={<Link href="/" />}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        Voltar ao início
      </Button>
      <div className="flex flex-col items-center gap-3 text-center animate-in duration-500 ease-out fade-in slide-in-from-bottom-2">
        <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-destaque-foreground text-lg font-bold text-destaque">
          S
        </span>
        <div>
          <p className="text-sm font-medium tracking-wide opacity-80">SPA UVA</p>
          <h1 className="text-3xl font-bold">Área interna</h1>
          <p className="text-sm opacity-80">Serviço de Psicologia Aplicada</p>
        </div>
      </div>
      <Card className="shadow-xl animate-in duration-500 ease-out fade-in zoom-in-95 delay-100 fill-mode-both">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Entrar</CardTitle>
          <CardDescription>Use seu e-mail e sua senha para entrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioLogin />
        </CardContent>
      </Card>
    </main>
  );
}
