export type EstadoEdicaoUsuario =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "conflito"; versaoEnviada: string }
  | { status: "sucesso"; mensagem: string; identificador: string };

export const ESTADO_INICIAL_USUARIO: EstadoEdicaoUsuario = { status: "inicial" };

export type EstadoCriacaoUsuario =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso"; linkConvite: string; expiraEm: string };
