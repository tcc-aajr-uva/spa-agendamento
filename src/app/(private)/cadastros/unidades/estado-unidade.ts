export type EstadoUnidade =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "conflito"; mensagem: string; versaoEnviada?: string }
  | { status: "sucesso"; mensagem: string; identificador: string };

export const ESTADO_INICIAL_UNIDADE: EstadoUnidade = { status: "inicial" };
