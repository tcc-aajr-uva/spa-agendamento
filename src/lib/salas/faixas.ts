export type Faixa = { diaSemana: number; horaInicio: number; horaFim: number };

export function salaDisponivel(faixas: Faixa[], diaSemana: number, horaInicio: number, duracaoMin: number): boolean {
  return faixas.some((faixa) => faixa.diaSemana === diaSemana && faixa.horaInicio <= horaInicio && horaInicio + duracaoMin <= faixa.horaFim);
}
