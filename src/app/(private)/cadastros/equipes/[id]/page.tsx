import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { IndicadorCarregando } from "@/components/indicador-carregando";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_EQUIPES } from "@/lib/equipe/escopo-equipe";

type Props = { params: Promise<{ id: string }> };

export default function EquipePage({ params }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <Suspense fallback={<IndicadorCarregando texto="Carregando equipe…" />}>
        <Redirecionar params={params} />
      </Suspense>
    </section>
  );
}

async function Redirecionar({ params }: Props) {
  const autor = await exigirUsuario([...PERFIS_EQUIPES]);
  const { id } = await params;
  if (!await consultarEquipe(id, autor)) notFound();
  return redirect(`/cadastros/equipes?editar=${id}&abaEquipe=dados`);
}
