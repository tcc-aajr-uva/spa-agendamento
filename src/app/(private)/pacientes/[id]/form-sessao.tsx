import type { StatusAgendamento } from "@/generated/prisma/client";
import { ultimaDataDeSessao } from "@/lib/atendimento/registrar-sessao";
import { formatarData } from "../../formatar";
import { FormularioAcao } from "../../formulario-acao";
import { registrar } from "./actions-sessao";

type Props = {
  agendamentoId: string;
  status: StatusAgendamento;
  diaSemana: number;
  dataInicio: Date;
  dataFim: Date;
  termoAssinado: boolean;
};

export function FormSessao({ agendamentoId, status, diaSemana, dataInicio, dataFim, termoAssinado }: Props) {
  if (status !== "CONFIRMADO") return null;

  const sugestao = ultimaDataDeSessao({ diaSemana, dataInicio, dataFim }, new Date());
  if (!sugestao) return <p className="text-sm">A primeira sessão ainda não aconteceu (início em {formatarData(dataInicio)}).</p>;

  return (
    <FormularioAcao acao={registrar.bind(null, agendamentoId)} rotulo="Registrar sessão">
      <label className="flex flex-col gap-1 text-sm">
        Data
        <input type="date" name="data" required defaultValue={sugestao.toISOString().slice(0, 10)} className="rounded border bg-transparent px-2 py-1" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Presença
        <select name="presenca" required className="rounded border bg-transparent px-2 py-1">
          <option value="PRESENTE">Presente</option>
          <option value="FALTA">Falta sem aviso</option>
          <option value="FALTA_JUSTIFICADA">Falta justificada</option>
        </select>
      </label>
      {!termoAssinado && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="termoAssinado" />
          Termo de consentimento assinado nesta sessão
        </label>
      )}
    </FormularioAcao>
  );
}
