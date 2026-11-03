import { Cartao } from "../../cartao";
import { FormularioAcao } from "../../formulario-acao";
import { gerarLink } from "./actions-link";

type Props = {
  agendamentoId: string;
  codigo?: string;
};

export function LinkCancelamento({ agendamentoId, codigo }: Props) {
  return (
    <Cartao titulo="Link de cancelamento">
      <p className="text-muted-foreground">
        Código de cancelamento: <strong className="text-foreground">{codigo ?? "ainda não gerado"}</strong>
      </p>
      <FormularioAcao
        acao={gerarLink.bind(null, agendamentoId)}
        rotulo="Gerar novo link de cancelamento"
        confirmacao="O link enviado antes ao paciente deixa de funcionar. Continuar?"
        variante="outline"
        larguraTotal
      />
    </Cartao>
  );
}
