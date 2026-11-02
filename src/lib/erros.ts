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
  | "SALA_EM_USO"
  | "CONFLITO_CONCORRENTE"
  | "PRAZO_VENCIDO"
  | "STATUS_INVALIDO"
  | "SESSAO_JA_REGISTRADA"
  | "DATA_INVALIDA";

export class ErroDeRegra extends Error {
  constructor(
    readonly codigo: CodigoErro,
    message: string,
  ) {
    super(message);
    this.name = "ErroDeRegra";
  }
}
