import { InfoIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { consultarAtendimentoEstagiario } from "@/lib/usuario/atendimento-estagiario";
import { dataDoPeriodo, formatarDataPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import type { ParametrosBusca } from "@/lib/url/parametros-busca";
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
    <Card id="atendimento" className="sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle><h2>Configuração de atendimento</h2></CardTitle>
        <CardDescription>A liberação e o limite são configurados por equipe e período letivo.</CardDescription>
      </CardHeader>
      <CardContent>
        {equipes.length === 0 ? (
          <Alert>
            <InfoIcon aria-hidden="true" />
            <AlertTitle>Nenhuma equipe disponível</AlertTitle>
            <AlertDescription>Não há vínculo ativo com equipe no seu escopo para configurar o atendimento.</AlertDescription>
          </Alert>
        ) : (
          <SeletorAtendimento equipes={equipes} equipeId={equipe?.id ?? ""} periodoId={periodo?.id ?? ""}
            periodos={periodos.map((opcao) => ({ id: opcao.id,
              nome: `${formatarDataPeriodo(dataDoPeriodo(opcao.inicio))} a ${formatarDataPeriodo(dataDoPeriodo(opcao.fim))}` }))}>
            {!equipe ? <p className="text-sm text-muted-foreground">Selecione uma equipe vinculada ao estagiário e dentro do seu escopo.</p>
              : !periodo ? <p className="text-sm text-muted-foreground">{periodos.length === 0 ? "Não há períodos letivos cadastrados na unidade desta equipe." : "Selecione um período letivo da unidade desta equipe."}</p>
              : <>
                {!configuracao && (
                  <Alert>
                    <InfoIcon aria-hidden="true" />
                    <AlertTitle>Atendimento ainda não configurado</AlertTitle>
                    <AlertDescription>O atendimento permanece bloqueado até a liberação.</AlertDescription>
                  </Alert>
                )}
                <FormularioAtendimento
                  key={`${equipe.id}:${periodo.id}`}
                  acao={salvarAtendimento.bind(null, estagiarioId, equipe.id, periodo.id)}
                  valores={{ liberado: configuracao?.liberado ?? false, limitePacientes: configuracao?.limitePacientes ?? 0,
                    versao: configuracao?.atualizadoEm.toISOString() ?? null }}
                />
              </>}
          </SeletorAtendimento>
        )}
      </CardContent>
    </Card>
  );
}
