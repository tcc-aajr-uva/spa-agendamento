import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { tokenTemFormatoValido } from "@/lib/token";
import { FormularioCancelamento } from "./formulario-cancelamento";

export const metadata = { referrer: "no-referrer" };
type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default function CancelarPage({ searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" nativeButton={false} className="-ml-2 self-start text-muted-foreground" render={<Link href="/" />}>
        <ChevronLeftIcon data-icon="inline-start" />
        Voltar ao início
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">Cancelar agendamento</h1>
      <Suspense fallback={<IndicadorCarregando />}>
        <ConteudoCancelamento searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ConteudoCancelamento({ searchParams }: Props) {
  const { token } = await searchParams;
  const tokenValido = typeof token === "string" && tokenTemFormatoValido(token) ? token : undefined;
  return (
    <Card className="animate-in duration-300 ease-out fade-in zoom-in-95">
      <CardHeader>
        <CardTitle className="text-lg">{tokenValido ? "Confirme o código" : "Informe seus dados"}</CardTitle>
        <CardDescription>
          {tokenValido
            ? "Digite o código de 6 caracteres que apareceu no fim do agendamento."
            : "Digite o CPF do paciente e o código de 6 caracteres que apareceu no fim do agendamento."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioCancelamento token={tokenValido} />
      </CardContent>
    </Card>
  );
}
