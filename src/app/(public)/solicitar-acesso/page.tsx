import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeftIcon } from "lucide-react";

import { FundoAbstrato } from "@/components/fundo-abstrato";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listarUnidadesDisponiveis } from "@/lib/solicitacao-acesso/unidades-disponiveis";
import { solicitarAcesso } from "./actions";
import { FormularioSolicitacao } from "./formulario-solicitacao";

export default function SolicitarAcessoPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6 text-destaque-foreground">
      <FundoAbstrato variante="destaque" />
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        className="self-start text-destaque-foreground hover:bg-destaque-foreground/10 hover:text-destaque-foreground"
        render={<Link href="/entrar" />}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        Voltar para o login
      </Button>
      <div className="flex flex-col items-center gap-3 text-center animate-in duration-500 ease-out fade-in slide-in-from-bottom-2">
        <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-destaque-foreground text-lg font-bold text-destaque">
          S
        </span>
        <div>
          <p className="text-sm font-medium tracking-wide opacity-80">SPA UVA</p>
          <h1 className="text-3xl font-bold">Solicitar acesso</h1>
          <p className="text-sm opacity-80">Serviço de Psicologia Aplicada</p>
        </div>
      </div>
      <Card className="shadow-xl animate-in duration-500 ease-out fade-in zoom-in-95 delay-100 fill-mode-both">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Cadastro de estagiário</CardTitle>
          <CardDescription>Informe seus dados. O acesso é liberado depois da aprovação da coordenação.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}>
            <ConteudoSolicitacao />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function ConteudoSolicitacao() {
  await connection();
  const unidades = await listarUnidadesDisponiveis();
  if (unidades.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma unidade está recebendo solicitações no momento.</p>;
  }
  return <FormularioSolicitacao acao={solicitarAcesso} unidades={unidades} />;
}
