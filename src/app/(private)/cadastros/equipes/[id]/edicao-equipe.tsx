"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { AlertasFormularioEquipe } from "../alertas-formulario-equipe";
import type { OpcoesCamposEquipe } from "../campos-formulario-equipe";
import { ESTADO_INICIAL_EQUIPE, type EstadoEquipe } from "../estado-equipe";
import { FormularioEquipeControlado, useControleFormularioEquipe, type AcaoEquipe } from "../formulario-equipe";
import type { ValoresEquipe } from "../formulario-equipe-schema";
import { ControleAtivacaoEquipe } from "./controle-ativacao";

type Props = OpcoesCamposEquipe & {
  acaoAtualizar: AcaoEquipe;
  acaoAlterarAtivacao: AcaoEquipe;
  unidadeFixa: string;
  valores: ValoresEquipe;
};

export function EdicaoEquipe(props: Props) {
  const [chave, definirChave] = useState(0);

  useLayoutEffect(() => {
    return () => definirChave((anterior) => anterior + 1);
  }, []);

  return <EdicaoEquipeInterna key={chave} {...props} />;
}

function EdicaoEquipeInterna({ acaoAtualizar, acaoAlterarAtivacao, valores, ...opcoes }: Props) {
  const router = useRouter();
  const controle = useControleFormularioEquipe({ acao: acaoAtualizar, valores, editando: true });
  const [estadoAtivacao, executarAtivacao, executandoAtivacao] = useActionState(acaoAlterarAtivacao, ESTADO_INICIAL_EQUIPE);
  const [conflitoAtivacaoAceito, aceitarConflitoAtivacao] = useState<EstadoEquipe | null>(null);
  const [recarregandoAtivacao, iniciarRecargaAtivacao] = useTransition();
  const ultimaNotificacao = useRef<EstadoEquipe | null>(null);

  useEffect(() => {
    if (estadoAtivacao.status !== "sucesso" || ultimaNotificacao.current === estadoAtivacao) return;
    ultimaNotificacao.current = estadoAtivacao;
    toast.add({ title: estadoAtivacao.mensagem, type: "success", timeout: 5_000 });
  }, [estadoAtivacao]);

  const conflitoAtivacao = estadoAtivacao.status === "conflito"
    && (conflitoAtivacaoAceito !== estadoAtivacao || valores.atualizadoEm === estadoAtivacao.versaoEnviada);
  const conflito = controle.possuiConflito || conflitoAtivacao || recarregandoAtivacao;
  const recarregando = controle.atualizandoVersao || recarregandoAtivacao;

  function carregarVersao() {
    if (controle.possuiConflito) controle.descartarAlteracoes();
    if (conflitoAtivacao) {
      aceitarConflitoAtivacao(estadoAtivacao);
      iniciarRecargaAtivacao(() => router.refresh());
    }
  }

  return (
    <div className="space-y-6">
      <AlertasFormularioEquipe conflito={conflito}
        ocupado={controle.ocupado || executandoAtivacao} recarregando={recarregando}
        carregarVersao={carregarVersao} erroSalvar={controle.mensagemErroGeral}
        erroVersao={controle.errors.atualizadoEm?.message}
        erroAtivacao={estadoAtivacao.status === "erro" ? estadoAtivacao.mensagem : undefined}
      />
      <FormularioEquipeControlado {...opcoes} controle={controle} rotuloBotao="Salvar alterações"
        bloqueioExterno={executandoAtivacao || conflitoAtivacao || recarregandoAtivacao}
      />
      {!opcoes.somenteLeitura && (
        <ControleAtivacaoEquipe executar={executarAtivacao} executando={executandoAtivacao}
          ativa={valores.ativa} atualizadoEm={valores.atualizadoEm}
          bloqueado={controle.bloqueado || controle.possuiRascunho || conflito || executandoAtivacao}
          bloqueadoPorRascunho={controle.possuiRascunho && !conflito} />
      )}
    </div>
  );
}
