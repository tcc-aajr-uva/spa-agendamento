import { Suspense } from "react";
import Link from "next/link";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { criarUnidade } from "../actions";
import { FormularioUnidade } from "../formulario-unidade";

export default function NovaUnidadePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link className="underline" href="/cadastros/unidades" prefetch={false}>Voltar para unidades</Link>
        <h1 className="text-2xl font-bold">Nova unidade</h1>
        <p className="text-sm text-gray-600">Cadastre a unidade e defina suas regras de agendamento.</p>
      </div>
      <Suspense fallback={<p>Carregando formulário…</p>}>
        <ConteudoNovaUnidade />
      </Suspense>
    </section>
  );
}

async function ConteudoNovaUnidade() {
  await exigirUsuario(["ADMINISTRADOR"]);
  return <FormularioUnidade acao={criarUnidade} rotuloBotao="Criar unidade" />;
}
