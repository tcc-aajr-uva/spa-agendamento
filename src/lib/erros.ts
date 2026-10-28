export type CodigoErro =
  | "DADOS_INVALIDOS"
  | "SEM_PERMISSAO"
  | "UNIDADE_FECHADA"
  | "SEM_PERIODO_LETIVO"
  | "HORARIO_OCUPADO"
  | "SEM_SALA_LIVRE"
  | "PACIENTE_JA_ATIVO"
  | "NAO_ENCONTRADO"
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
