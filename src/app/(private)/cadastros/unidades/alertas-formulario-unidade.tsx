"use client";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { AlertaConflito } from "@/components/alerta-conflito";

type Props = {
  atualizandoVersao: boolean;
  mensagemErroVersao?: string;
  mensagensErrosGerais?: string[];
  onCarregarVersao: () => void;
  possuiConflito: boolean;
};

export function AlertasFormularioUnidade({
  atualizandoVersao,
  mensagemErroVersao,
  mensagensErrosGerais = [],
  onCarregarVersao,
  possuiConflito,
}: Props) {
  if (!mensagensErrosGerais.length && !mensagemErroVersao && !possuiConflito) return null;

  return (
    <div className="space-y-3">
      {mensagemErroVersao && (
        <AlertaErroOperacao titulo="Não foi possível salvar a unidade" mensagem={mensagemErroVersao} />
      )}

      {possuiConflito && (
        <AlertaConflito
          titulo="Unidade alterada em outra sessão"
          descricao="A unidade foi atualizada depois que você abriu esta tela."
          carregando={atualizandoVersao}
          onCarregar={onCarregarVersao}
        />
      )}

      {mensagensErrosGerais.map((mensagem, indice) => (
        <AlertaErroOperacao key={`${indice}-${mensagem}`} titulo="Não foi possível concluir a operação" mensagem={mensagem} />
      ))}
    </div>
  );
}
