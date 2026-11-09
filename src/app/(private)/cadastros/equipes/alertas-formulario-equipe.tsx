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

export function AlertasFormularioEquipe({ conflito, ocupado, recarregando, carregarVersao, erroSalvar, erroAtivacao, erroVersao }: Props) {
  if (!conflito && !erroSalvar && !erroAtivacao && !erroVersao) return null;

  return (
    <div className="space-y-3">
      {erroVersao && (
        <AlertaErroOperacao titulo="Não foi possível salvar a equipe" mensagem={erroVersao} />
      )}
      {conflito && (
        <AlertaConflito
          titulo="Equipe alterada em outra sessão"
          descricao="A equipe foi atualizada depois que você abriu esta tela."
          carregando={recarregando}
          bloqueado={ocupado}
          onCarregar={carregarVersao}
        />
      )}
      {erroSalvar && (
        <AlertaErroOperacao titulo="Não foi possível salvar a equipe" mensagem={erroSalvar} />
      )}
      {erroAtivacao && (
        <AlertaErroOperacao titulo="Não foi possível alterar a situação" mensagem={erroAtivacao} />
      )}
    </div>
  );
}
