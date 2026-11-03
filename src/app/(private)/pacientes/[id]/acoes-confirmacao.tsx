import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { StatusAgendamento } from "@/generated/prisma/client";
import { motivosDeEncerramento } from "@/lib/atendimento/encerrar";
import { rotuloDoMotivo } from "@/lib/atendimento/rotulos";
import { CampoSelect } from "../../campo-select";
import { Cartao } from "../../cartao";
import { FormularioAcao } from "../../formulario-acao";
import { confirmar, encerrar } from "./actions-confirmacao";

type Props = {
  agendamentoId: string;
  status: StatusAgendamento;
};

export function AcoesConfirmacao({ agendamentoId, status }: Props) {
  const motivos = motivosDeEncerramento(status);
  const rotulo = status === "PENDENTE" ? "Cancelar e liberar horário" : "Encerrar atendimento";

  return (
    <>
      {status === "PENDENTE" && (
        <Cartao titulo="Confirmar agendamento">
          <FormularioAcao acao={confirmar.bind(null, agendamentoId)} rotulo="Confirmar agendamento" larguraTotal />
        </Cartao>
      )}
      {motivos.length > 0 && (
        <Cartao titulo={rotulo}>
          <FormularioAcao
            acao={encerrar.bind(null, agendamentoId)}
            rotulo={rotulo}
            confirmacao="Isso libera o horário e a sala. Continuar?"
            variante="destructive"
            larguraTotal
          >
            <CampoSelect
              id="encerrar-motivo"
              nome="motivo"
              rotulo="Motivo"
              opcoes={motivos.map((motivo) => ({ value: motivo, label: rotuloDoMotivo(motivo) }))}
              obrigatorio
            />
            <Field>
              <FieldLabel htmlFor="encerrar-observacao">Observação</FieldLabel>
              <Input id="encerrar-observacao" name="observacao" maxLength={200} />
            </Field>
          </FormularioAcao>
        </Cartao>
      )}
    </>
  );
}
