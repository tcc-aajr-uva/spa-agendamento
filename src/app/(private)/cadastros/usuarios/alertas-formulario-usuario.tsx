"use client";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { AlertaConflito } from "@/components/alerta-conflito";

type Props = {
  conflito: boolean;
  ocupado: boolean;
  recarregando: boolean;
  carregarVersao: () => void;
  erroSalvar?: string;
  erroAtivacao?: string;
  erroVersao?: string;
};

export function AlertasFormularioUsuario({ conflito, ocupado, recarregando, carregarVersao, erroSalvar, erroAtivacao, erroVersao }: Props) {
  if (!conflito && !erroSalvar && !erroAtivacao && !erroVersao) return null;

  return (
    <div className="space-y-3">
      {erroVersao && (
        <AlertaErroOperacao titulo="Não foi possível salvar o usuário" mensagem={erroVersao} />
      )}
      {conflito && (
        <AlertaConflito
          titulo="Usuário alterado em outra sessão"
          descricao="O usuário foi atualizado depois que você abriu esta tela."
          carregando={recarregando}
          bloqueado={ocupado}
          onCarregar={carregarVersao}
        />
      )}
      {erroSalvar && (
        <AlertaErroOperacao titulo="Não foi possível salvar o usuário" mensagem={erroSalvar} />
      )}
      {erroAtivacao && (
        <AlertaErroOperacao titulo="Não foi possível alterar a situação" mensagem={erroAtivacao} />
      )}
    </div>
  );
}
