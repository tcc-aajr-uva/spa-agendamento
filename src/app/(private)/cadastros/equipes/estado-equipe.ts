export type EstadoEquipe =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "conflito"; mensagem: string; versaoEnviada: string }
  | { status: "sucesso"; mensagem: string; identificador: string };

export const ESTADO_INICIAL_EQUIPE: EstadoEquipe = { status: "inicial" };
