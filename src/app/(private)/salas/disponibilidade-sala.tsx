import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { DIAS_DA_SEMANA, formatarHora, horariosDaGrade, type Grade } from "@/lib/agendamento/regras";
import { Cartao, EstadoVazio } from "../cartao";
import { FormularioAcao } from "../formulario-acao";
import { excluirDisponibilidade, salvarDisponibilidade } from "./actions";
import { CamposDisponibilidade } from "./campos-disponibilidade";

type Props = {
  sala: { id: string; nome: string; disponibilidades: { id: string; diaSemana: number; horaInicio: number; horaFim: number }[] };
  grade: Grade;
};

export function DisponibilidadeSala({ sala, grade }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {sala.disponibilidades.length === 0 ? (
        <EstadoVazio>Sem disponibilidade: a sala não aparece para os estagiários agendarem.</EstadoVazio>
      ) : (
        <ItemGroup className="max-h-64 gap-0 divide-y overflow-y-auto rounded-xl ring-1 ring-foreground/10">
          {sala.disponibilidades.map((faixa) => {
            const descricao = `${DIAS_DA_SEMANA[faixa.diaSemana]}, ${formatarHora(faixa.horaInicio)} às ${formatarHora(faixa.horaFim)}`;
            return (
              <Item key={faixa.id} size="sm" className="rounded-none">
                <ItemContent>
                  <ItemTitle className="font-normal tabular-nums">{descricao}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <FormularioAcao
                    acao={excluirDisponibilidade.bind(null, faixa.id)}
                    rotulo="Remover"
                    confirmacao={`Remover ${descricao} da ${sala.nome}? Os atendimentos já marcados continuam.`}
                    variante="ghost"
                    tamanho="sm"
                  />
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      )}
      <Cartao titulo="Adicionar disponibilidade">
        <FormularioAcao acao={salvarDisponibilidade.bind(null, sala.id)} rotulo="Adicionar" larguraTotal>
          <CamposDisponibilidade idBase={`disponibilidade-${sala.id}`} horas={horariosDaGrade(grade)} duracaoBlocoMin={grade.duracaoBlocoMin} />
        </FormularioAcao>
      </Cartao>
    </div>
  );
}
