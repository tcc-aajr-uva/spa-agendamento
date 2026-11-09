import { formatarHora } from "@/lib/agendamento/regras";
import type { GradeDeOcupacao, SituacaoCelula } from "@/lib/painel/ocupacao";

const ESTILO: Record<SituacaoCelula, string> = {
  LIVRE: "bg-muted text-muted-foreground",
  OCUPADA: "bg-primary text-primary-foreground",
  PENDENTE: "bg-secondary text-secondary-foreground",
};

const ROTULO: Record<SituacaoCelula, string> = {
  LIVRE: "Livre",
  OCUPADA: "Ocupada",
  PENDENTE: "Pendente",
};

export function GradeOcupacao({ grade }: { grade: GradeDeOcupacao }) {
  if (grade.salas.length === 0) {
    return <p className="text-muted-foreground">Nenhuma sala ativa nesta unidade.</p>;
  }
  if (grade.linhas.length === 0) {
    return <p className="text-muted-foreground">Nenhum horário com agendamento neste dia.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left font-normal text-muted-foreground">
              Horário
            </th>
            {grade.salas.map((sala) => (
              <th key={sala.id} scope="col" className="px-2 py-1 font-normal text-muted-foreground">
                {sala.nome}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grade.linhas.map((linha) => (
            <tr key={linha.horaInicio}>
              <th scope="row" className="px-2 text-left font-normal text-muted-foreground">
                {formatarHora(linha.horaInicio)}
              </th>
              {linha.celulas.map((situacao, indice) => (
                <td key={grade.salas[indice].id} className={`rounded-md px-2 py-2.5 text-center ${ESTILO[situacao]}`}>
                  {ROTULO[situacao]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}