export type CodigoErro =
  | "DADOS_INVALIDOS"
  | "SEM_PERMISSAO"
  | "UNIDADE_FECHADA"
  | "SEM_PERIODO_LETIVO"
  | "HORARIO_OCUPADO"
  | "SEM_SALA_LIVRE"
  | "PACIENTE_JA_ATIVO"
  | "EMAIL_EM_USO"
  | "EQUIPE_COM_SUPERVISOR"
  | "CONVITE_INVALIDO"
  | "LIMITE_REQUISICOES"
  | "NAO_ENCONTRADO"
  | "CONFLITO_CONCORRENTE";

export class ErroDeRegra extends Error {
  constructor(
    readonly codigo: CodigoErro,
    message: string,
  ) {
    super(message);
    this.name = "ErroDeRegra";
  }
}
