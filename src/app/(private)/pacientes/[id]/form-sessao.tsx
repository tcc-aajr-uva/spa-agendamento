import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { StatusAgendamento } from "@/generated/prisma/client";
import { ultimaDataDeSessao } from "@/lib/atendimento/registrar-sessao";
import { OPCOES_DE_PRESENCA } from "@/lib/atendimento/rotulos";
import { CampoSelect } from "../../campo-select";
import { Cartao } from "../../cartao";
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

  return (
    <Cartao titulo="Registrar sessão">
      {sugestao ? (
        <FormularioAcao acao={registrar.bind(null, agendamentoId)} rotulo="Registrar sessão" larguraTotal>
          <Field>
            <FieldLabel htmlFor="sessao-data">Data</FieldLabel>
            <Input id="sessao-data" type="date" name="data" required defaultValue={sugestao.toISOString().slice(0, 10)} />
          </Field>
          <CampoSelect id="sessao-presenca" nome="presenca" rotulo="Presença" opcoes={OPCOES_DE_PRESENCA} obrigatorio />
          {!termoAssinado && (
            <Field orientation="horizontal">
              <Checkbox id="sessao-termo" name="termoAssinado" />
              <FieldLabel htmlFor="sessao-termo" className="font-normal">
                Termo de consentimento assinado nesta sessão
              </FieldLabel>
            </Field>
          )}
        </FormularioAcao>
      ) : (
        <p className="text-muted-foreground">A primeira sessão ainda não aconteceu (início em {formatarData(dataInicio)}).</p>
      )}
    </Cartao>
  );
}
