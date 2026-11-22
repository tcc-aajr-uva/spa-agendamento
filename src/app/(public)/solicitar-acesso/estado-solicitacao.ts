export type EstadoSolicitacaoAcesso =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso" };

export const ESTADO_INICIAL_SOLICITACAO: EstadoSolicitacaoAcesso = { status: "inicial" };
