import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { consultarAtendimentoEstagiario } from "@/lib/usuario/atendimento-estagiario";
import { dataDoPeriodo, formatarDataPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
import { AtualizarAoFocar } from "../../../atualizar-ao-focar";
import { salvarAtendimento } from "./actions-atendimento";
import { FormularioAtendimento } from "./formulario-atendimento";
import { SeletorAtendimento } from "./seletor-atendimento";

type Props = {
  estagiarioId: string;
  autor: ContextoAutorizacao;
  searchParams: Promise<ParametrosBusca>;
};

export async function SecaoAtendimento({ estagiarioId, autor, searchParams }: Props) {
  const busca = await searchParams;
  const equipeId = typeof busca.atendimentoEquipe === "string" ? busca.atendimentoEquipe : undefined;
  const periodoId = typeof busca.atendimentoPeriodo === "string" ? busca.atendimentoPeriodo : undefined;
  const dados = await consultarAtendimentoEstagiario(estagiarioId, autor, equipeId, periodoId);
  if (!dados) return null;
  const { equipes, periodos, equipe, periodo, configuracao } = dados;

  return (
    <section id="atendimento" className="space-y-4">
      <AtualizarAoFocar />
      <h2 className="text-lg font-semibold">Configuração de atendimento</h2>
      <p className="text-sm text-gray-600">A liberação e o limite são configurados por equipe e período letivo.</p>
      {equipes.length === 0 ? <p>Não há vínculo ativo com equipe no seu escopo para configurar o atendimento.</p> :
        <SeletorAtendimento equipes={equipes} equipeId={equipe?.id ?? ""} periodoId={periodo?.id ?? ""}
          periodos={periodos.map((opcao) => ({ id: opcao.id,
            nome: `${formatarDataPeriodo(dataDoPeriodo(opcao.inicio))} a ${formatarDataPeriodo(dataDoPeriodo(opcao.fim))}` }))}>
        {!equipe ? <p>Selecione uma equipe vinculada ao estagiário e dentro do seu escopo.</p>
          : !periodo ? <p>{periodos.length === 0 ? "Não há períodos letivos cadastrados na unidade desta equipe." : "Selecione um período letivo da unidade desta equipe."}</p>
          : <>
            {!configuracao && <p className="text-sm text-gray-600">Ainda não há configuração para esta equipe e período. O atendimento permanece bloqueado até a liberação.</p>}
            <FormularioAtendimento
              key={`${equipe.id}:${periodo.id}`}
              acao={salvarAtendimento.bind(null, estagiarioId, equipe.id, periodo.id)}
              valores={{ liberado: configuracao?.liberado ?? false, limitePacientes: configuracao?.limitePacientes ?? 0,
                versao: configuracao?.atualizadoEm.toISOString() ?? null }}
            />
          </>}
        </SeletorAtendimento>}
    </section>
  );
}
