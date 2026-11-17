"use client";

import { ControleAtivacaoCadastro } from "@/components/controle-ativacao-cadastro";

type Props = {
  ativa: boolean;
  atualizadoEm: string;
  bloqueada: boolean;
  bloqueadaPorRascunho: boolean;
  executar: (formData: FormData) => void;
  executando: boolean;
};

const TEXTOS = {
  titulo: "Situação da unidade",
  descricaoAtivo: "A inativação preserva os dados e vínculos existentes e retira a unidade dos fluxos ativos. Usuários ativos precisam ter outra unidade ativa. Caso contrário, resolva seus vínculos ou inative suas contas na tela Usuários antes de continuar.",
  descricaoInativo: "A ativação torna a unidade novamente disponível nos fluxos do sistema.",
  avisoRascunho: "Salve as alterações da unidade antes de alterar sua situação.",
  tituloConfirmacao: "Inativar esta unidade?",
  descricaoConfirmacao: "Ela deixará de aparecer nos escopos e agendamentos. A operação será bloqueada se algum usuário ativo ficar sem uma unidade ativa. Os vínculos e o histórico existentes serão preservados.",
  rotuloAtivar: "Ativar unidade",
  rotuloInativar: "Inativar unidade",
};

export function ControleAtivacaoUnidade({ ativa, atualizadoEm, bloqueada, bloqueadaPorRascunho, executar, executando }: Props) {
  return (
    <ControleAtivacaoCadastro
      ativo={ativa} atualizadoEm={atualizadoEm} bloqueado={bloqueada}
      bloqueadoPorRascunho={bloqueadaPorRascunho} executar={executar} executando={executando}
      textos={TEXTOS}
    />
  );
}
