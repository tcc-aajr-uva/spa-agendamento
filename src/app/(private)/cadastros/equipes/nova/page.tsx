import { Suspense } from "react";
import Link from "next/link";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUnidadesParaEquipe, listarSupervisoresParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_GESTAO_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { criarEquipe } from "../actions";
import { FormularioEquipe } from "../formulario-equipe";

export default function NovaEquipePage() {
  return (
    <section className="space-y-6">
      <Link href="/cadastros/equipes" className="underline" prefetch={false}>Voltar para equipes</Link>
      <h1 className="text-2xl font-bold">Nova equipe</h1>
      <Suspense fallback={<p>Carregando formulário…</p>}><Conteudo /></Suspense>
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
