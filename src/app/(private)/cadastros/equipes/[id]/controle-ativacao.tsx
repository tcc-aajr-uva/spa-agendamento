"use client";

import { ControleAtivacaoCadastro } from "@/components/controle-ativacao-cadastro";

type Props = {
  executar: (formData: FormData) => void;
  executando: boolean;
  ativa: boolean;
  atualizadoEm: string;
  bloqueado: boolean;
  bloqueadoPorRascunho: boolean;
};

const TEXTOS = {
  titulo: "Situação da equipe",
  descricaoAtivo: "A inativação retira a equipe dos fluxos ativos e preserva os vínculos e agendamentos existentes, sem cancelá-los automaticamente.",
  descricaoInativo: "A ativação torna a equipe novamente disponível nos fluxos do sistema.",
  avisoRascunho: "Salve ou desfaça as alterações no formulário para mudar a situação da equipe.",
  tituloConfirmacao: "Inativar esta equipe?",
  descricaoConfirmacao: "Ela deixará de aparecer nos fluxos ativos. Os vínculos e agendamentos existentes serão preservados.",
  rotuloAtivar: "Ativar equipe",
  rotuloInativar: "Inativar equipe",
};

export function ControleAtivacaoEquipe({ executar, executando, ativa, atualizadoEm, bloqueado, bloqueadoPorRascunho }: Props) {
  return (
    <ControleAtivacaoCadastro
      ativo={ativa} atualizadoEm={atualizadoEm} bloqueado={bloqueado}
      bloqueadoPorRascunho={bloqueadoPorRascunho} executar={executar} executando={executando}
      textos={TEXTOS}
    />
  );
}
