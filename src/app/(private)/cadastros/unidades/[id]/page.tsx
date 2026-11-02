import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarUnidadeGerenciavel } from "@/lib/unidade/consultar-unidade";
import { PERFIS_UNIDADES, podeAlterarAtivacaoDeUnidade } from "@/lib/unidade/escopo-unidade";
import { alterarAtivacao, atualizarUnidade } from "../actions";
import { FormularioUnidade } from "../formulario-unidade";
import { ControleAtivacaoUnidade } from "./controle-ativacao";

type Props = { params: Promise<{ id: string }> };

export default function UnidadePage({ params }: Props) {
  return (
    <section className="space-y-6">
      <Link className="underline" href="/cadastros/unidades" prefetch={false}>Voltar para unidades</Link>
      <Suspense fallback={<p>Carregando unidade…</p>}>
        <ConteudoUnidade params={params} />
      </Suspense>
    </section>
  );
}

async function ConteudoUnidade({ params }: Props) {
  const autor = await exigirUsuario([...PERFIS_UNIDADES]);
  const { id } = await params;
  const unidade = await consultarUnidadeGerenciavel(id, autor);
  if (!unidade) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{unidade.nome}</h1>
          <span className={`rounded border px-2 py-0.5 text-sm ${unidade.ativa ? "" : "text-red-700"}`}>
            {unidade.ativa ? "Ativa" : "Inativa"}
          </span>
        </div>
        <p className="text-sm text-gray-600">Altere as regras de funcionamento e de agendamento da unidade.</p>
      </div>

      <FormularioUnidade
        acao={atualizarUnidade.bind(null, unidade.id)}
        podeAlterarDadosAdministrativos={autor.perfil !== "SECRETARIA"}
        rotuloBotao="Salvar alterações"
        valores={{ ...unidade, atualizadoEm: unidade.atualizadoEm.toISOString() }}
      />

      {podeAlterarAtivacaoDeUnidade(autor) && (
        <ControleAtivacaoUnidade acao={alterarAtivacao.bind(null, unidade.id)} ativa={unidade.ativa} />
      )}
    </div>
  );
}
