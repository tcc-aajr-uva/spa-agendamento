"use client";

import { ControleAtivacaoCadastro } from "@/components/controle-ativacao-cadastro";

type Props = {
  executar: (formData: FormData) => void;
  executando: boolean;
  ativo: boolean;
  atualizadoEm: string;
  bloqueado: boolean;
  bloqueadoPorRascunho: boolean;
};

const TEXTOS = {
  titulo: "Situação do usuário",
  descricaoAtivo: "A inativação encerra as sessões e revoga os convites pendentes.",
  descricaoInativo: "Antes de ativar, confirme se os vínculos do usuário estão corretos.",
  avisoRascunho: "Salve ou desfaça as alterações no formulário para mudar a situação do usuário.",
  tituloConfirmacao: "Inativar este usuário?",
  descricaoConfirmacao: "As sessões serão encerradas e os convites pendentes serão revogados.",
  rotuloAtivar: "Ativar usuário",
  rotuloInativar: "Inativar usuário",
};

export function ControleAtivacaoUsuario(props: Props) {
  return (
    <ControleAtivacaoCadastro
      {...props}
      textos={TEXTOS}
    />
  );
}
