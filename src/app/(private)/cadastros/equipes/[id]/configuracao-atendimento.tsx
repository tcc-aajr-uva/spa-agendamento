import { Badge } from "@/components/ui/badge";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarEquipe } from "@/lib/equipe/consultar-equipe";
import { dataDoPeriodo, formatarDataPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import { consultarAtendimentoEstagiario } from "@/lib/usuario/atendimento-estagiario";
import { consultarUsuarioGerenciavel } from "@/lib/usuario/consultar-usuario-gerenciavel";
import { rotuloDoEstadoAcesso } from "@/lib/usuario/rotulos";
import { salvarAtendimento } from "./actions-atendimento";
import { FormularioAtendimento } from "./formulario-atendimento";
import { SeletorPeriodoAtendimento } from "../seletor-periodo-atendimento";

export async function ConfiguracaoAtendimentoEquipe({ equipeId, estagiarioId, periodoId }: {
  equipeId: string; estagiarioId: string; periodoId?: string;
}) {
  const autor = await exigirUsuario(["ADMINISTRADOR", "SUPERVISOR"]);
  const equipe = await consultarEquipe(equipeId, autor);
  if (!equipe) return <p className="text-muted-foreground">Equipe não encontrada ou consulta não permitida.</p>;
  const [usuario, dados] = await Promise.all([
    consultarUsuarioGerenciavel(estagiarioId, autor),
    consultarAtendimentoEstagiario(estagiarioId, autor, equipeId, periodoId),
  ]);
  if (!usuario || !dados?.equipe) {
    return <p className="text-muted-foreground">Configuração indisponível. Confira o vínculo ativo, a equipe, a conta e o período selecionado.</p>;
  }
  const { periodo, configuracao } = dados;

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold wrap-break-word">{usuario.nome}</h2>
          <Badge variant={usuario.estadoAcesso === "ATIVO" ? "default" : "outline"}>{rotuloDoEstadoAcesso(usuario.estadoAcesso)}</Badge>
        </div>
      </div>
      <SeletorPeriodoAtendimento periodoId={periodo?.id ?? ""}
        periodos={dados.periodos.map(({ id, inicio, fim }) => ({ id, nome: `${formatarDataPeriodo(dataDoPeriodo(inicio))} a ${formatarDataPeriodo(dataDoPeriodo(fim))}` }))} />
      {!periodo ? <p className="text-sm text-muted-foreground">{dados.periodos.length === 0
        ? "A unidade desta equipe ainda não possui períodos letivos."
        : !periodoId ? "Sem período letivo vigente. Selecione um período para consultar a configuração."
          : "Selecione um período letivo válido da unidade desta equipe."}</p> : <>
        {!configuracao && <p className="text-sm text-muted-foreground">Atendimento ainda não configurado. Novos agendamentos permanecem bloqueados até a liberação com limite maior que zero.</p>}
        <FormularioAtendimento key={`${estagiarioId}:${equipeId}:${periodo.id}`}
        acao={salvarAtendimento.bind(null, estagiarioId, equipeId, periodo.id)}
        valores={{ liberado: configuracao?.liberado ?? false, limitePacientes: configuracao?.limitePacientes ?? 0,
          versao: configuracao?.atualizadoEm.toISOString() ?? null }} />
      </>}
    </div>
  );
}
