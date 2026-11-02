import { FormularioAcao } from "../../formulario-acao";
import { gerarLink } from "./actions-link";

type Props = {
  agendamentoId: string;
  codigo?: string;
};

export function LinkCancelamento({ agendamentoId, codigo }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p>
        Código de cancelamento: <strong>{codigo ?? "ainda não gerado"}</strong>
      </p>
      <FormularioAcao
        acao={gerarLink.bind(null, agendamentoId)}
        rotulo="Gerar novo link de cancelamento"
        confirmacao="O link enviado antes ao paciente deixa de funcionar. Continuar?"
      />
    </div>
  );
}
