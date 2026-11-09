"use client";

import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { AlertasFormularioUnidade } from "../alertas-formulario-unidade";
import {
  FormularioUnidadeControlado,
  useControleFormularioUnidade,
  type AcaoUnidade,
  type ValoresUnidade,
} from "../formulario-unidade";
import { ESTADO_INICIAL_UNIDADE, type EstadoUnidade } from "../estado-unidade";
import { AbasUnidade } from "./abas-unidade";
import { ControleAtivacaoUnidade } from "./controle-ativacao";

type Props = {
  acaoAlterarAtivacao: AcaoUnidade;
  acaoAtualizar: AcaoUnidade;
  ativa: boolean;
  podeAlterarAtivacao: boolean;
  podeAlterarDadosAdministrativos: boolean;
  periodos: ReactNode;
  valores: ValoresUnidade;
};

export function EdicaoUnidade(props: Props) {
  const [chaveDaEdicao, setChaveDaEdicao] = useState(0);

  useLayoutEffect(() => {
    return () => setChaveDaEdicao((chaveAtual) => chaveAtual + 1);
  }, []);

  return <EdicaoUnidadeInterna key={chaveDaEdicao} {...props} />;
}

function EdicaoUnidadeInterna({
  acaoAlterarAtivacao,
  acaoAtualizar,
  ativa,
  podeAlterarAtivacao,
  podeAlterarDadosAdministrativos,
  periodos,
  valores,
}: Props) {
  const router = useRouter();
  const formulario = useControleFormularioUnidade({
    acao: acaoAtualizar,
    valores,
  });
  const [estadoAtivacao, executarAtivacao, executandoAtivacao] = useActionState(
    acaoAlterarAtivacao,
    ESTADO_INICIAL_UNIDADE,
  );
  const ultimaNotificacaoAtivacao = useRef<string | undefined>(undefined);
  const [conflitoAtivacaoAceito, setConflitoAtivacaoAceito] = useState<EstadoUnidade | null>(null);
  const [recarregandoAtivacao, iniciarRecargaAtivacao] = useTransition();

  useEffect(() => {
    if (
      estadoAtivacao.status !== "sucesso" ||
      ultimaNotificacaoAtivacao.current === estadoAtivacao.identificador
    ) {
      return;
    }
    ultimaNotificacaoAtivacao.current = estadoAtivacao.identificador;
    toast.add({
      title: estadoAtivacao.mensagem,
      type: "success",
      timeout: 5_000,
    });
  }, [estadoAtivacao]);

  const mensagensErrosGerais = [
    formulario.mensagemErroGeral,
    estadoAtivacao.status === "erro" ? estadoAtivacao.mensagem : undefined,
  ].filter((mensagem): mensagem is string => Boolean(mensagem));
  const possuiConflitoAtivacao =
    estadoAtivacao.status === "conflito" &&
    (conflitoAtivacaoAceito !== estadoAtivacao ||
      valores.atualizadoEm === estadoAtivacao.versaoEnviada ||
      recarregandoAtivacao);
  const possuiConflito = formulario.possuiConflito || possuiConflitoAtivacao;
  const bloquearAtivacao =
    possuiConflito ||
    formulario.possuiRascunho ||
    formulario.enviando ||
    formulario.atualizandoVersao;

  function carregarVersao() {
    if (formulario.possuiConflito) formulario.descartarAlteracoes();
    if (possuiConflitoAtivacao) {
      iniciarRecargaAtivacao(() => {
        setConflitoAtivacaoAceito(estadoAtivacao);
        router.refresh();
      });
    }
  }

  return (
    <div className="space-y-6">
      <AlertasFormularioUnidade
        atualizandoVersao={formulario.atualizandoVersao || recarregandoAtivacao}
        mensagemErroVersao={formulario.mensagemErroVersao}
        mensagensErrosGerais={mensagensErrosGerais}
        onCarregarVersao={carregarVersao}
        possuiConflito={possuiConflito}
      />

      <AbasUnidade
        bloqueada={possuiConflito}
        dados={
          <>
            <FormularioUnidadeControlado
              bloqueioExterno={executandoAtivacao || possuiConflitoAtivacao}
              controle={formulario}
              podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
              rotuloBotao="Salvar alterações"
            />
            {podeAlterarAtivacao && (
              <ControleAtivacaoUnidade
                ativa={ativa}
                atualizadoEm={valores.atualizadoEm}
                bloqueada={bloquearAtivacao}
                bloqueadaPorRascunho={
                  formulario.possuiRascunho && !possuiConflito
                }
                executar={executarAtivacao}
                executando={executandoAtivacao}
              />
            )}
          </>
        }
        periodos={periodos}
      />
    </div>
  );
}
