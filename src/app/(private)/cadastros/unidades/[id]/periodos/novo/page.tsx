import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConteudoNovoPeriodo } from "./conteudo-novo-periodo";
import { IndicadorCarregando } from "@/components/indicador-carregando";

type Props = { params: Promise<{ id: string }> };

export default function NovoPeriodoPage(props: Props) {
  return <section className="mx-auto w-full max-w-7xl space-y-6"><Suspense fallback={<IndicadorCarregando texto="Carregando formulário…" />}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link prefetch={false} href={`/cadastros/unidades/${id}#periodos`} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para unidade
      </Button>
      <h1 className="text-2xl font-bold">Novo período letivo</h1>
      <ConteudoNovoPeriodo id={id} />
    </div>
  );
}
