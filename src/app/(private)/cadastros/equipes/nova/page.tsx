import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUnidadesParaEquipe, listarSupervisoresParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_GESTAO_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { criarEquipe } from "../actions";
import { FormularioEquipe } from "../formulario-equipe";

export default function NovaEquipePage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/cadastros/equipes" prefetch={false} />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar para equipes
        </Button>
        <h1 className="text-2xl font-bold">Nova equipe</h1>
        <p className="text-sm text-muted-foreground">Cadastre a equipe e defina sua unidade e supervisão responsável.</p>
      </div>
      <Suspense fallback={<p>Carregando formulário…</p>}>
        <Conteudo />
      </Suspense>
    </section>
  );
}

async function Conteudo() {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  const [unidades, supervisores] = await Promise.all([
    listarUnidadesParaEquipe(autor), listarSupervisoresParaEquipe(autor),
  ]);
  if (unidades.length === 0) return <p>Nenhuma unidade ativa disponível no seu escopo para cadastrar uma equipe.</p>;
  return <FormularioEquipe acao={criarEquipe} unidades={unidades} supervisores={supervisores} />;
}
