export type EstadoAprovacaoSolicitacao =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso"; linkConvite: string; expiraEm: string };

export const ESTADO_INICIAL_APROVACAO: EstadoAprovacaoSolicitacao = { status: "inicial" };

export type EstadoRecusaSolicitacao =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso" };

export const ESTADO_INICIAL_RECUSA: EstadoRecusaSolicitacao = { status: "inicial" };
