import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { DetalhePeriodo } from "./detalhe-periodo";

type Props = { params: Promise<{ id: string; periodoId: string }> };

export default function PeriodoPage(props: Props) {
  return <section className="mx-auto w-full max-w-7xl space-y-6"><Suspense fallback={<IndicadorCarregando texto="Carregando período letivo…" />}><Conteudo {...props} /></Suspense></section>;
}

async function Conteudo({ params }: Props) {
  const { id, periodoId } = await params;
  const caminhoLista = `/cadastros/unidades/${id}#periodos`;
  return (
    <div className="space-y-6">
      <Button variant="ghost" nativeButton={false} render={<Link prefetch={false} href={caminhoLista} />}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Voltar para unidade
      </Button>
      <DetalhePeriodo unidadeId={id} periodoId={periodoId} caminhoLista={caminhoLista} paginaCheia />
    </div>
  );
}
