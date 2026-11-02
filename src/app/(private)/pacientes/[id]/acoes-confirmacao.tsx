import type { StatusAgendamento } from "@/generated/prisma/client";
import { motivosDeEncerramento, type MotivoDeEncerramento } from "@/lib/atendimento/encerrar";
import { FormularioAcao } from "../../formulario-acao";
import { confirmar, encerrar } from "./actions-confirmacao";

const ROTULOS: Record<MotivoDeEncerramento, string> = {
  NAO_LOCALIZADO: "Não localizado / contato inexistente",
  DESISTENCIA: "Desistência",
  ALTA: "Alta",
  CANCELADO_PELO_ESTAGIARIO: "Cancelado pelo estagiário",
};

type Props = {
  agendamentoId: string;
  status: StatusAgendamento;
};

export function AcoesConfirmacao({ agendamentoId, status }: Props) {
  const motivos = motivosDeEncerramento(status);

  return (
    <div className="flex flex-col gap-3">
      {status === "PENDENTE" && <FormularioAcao acao={confirmar.bind(null, agendamentoId)} rotulo="Confirmar agendamento" />}
      {motivos.length > 0 && (
        <FormularioAcao
          acao={encerrar.bind(null, agendamentoId)}
          rotulo={status === "PENDENTE" ? "Cancelar e liberar horário" : "Encerrar atendimento"}
          confirmacao="Isso libera o horário e a sala. Continuar?"
        >
          <label className="flex flex-col gap-1 text-sm">
            Motivo
            <select name="motivo" required className="rounded border bg-transparent px-2 py-1">
              {motivos.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {ROTULOS[motivo]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Observação
            <input name="observacao" maxLength={200} className="rounded border bg-transparent px-2 py-1" />
          </label>
        </FormularioAcao>
      )}
    </div>
  );
}
