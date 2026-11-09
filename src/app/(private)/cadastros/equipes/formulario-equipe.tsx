"use client";

import { startTransition, useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { AlertasFormularioEquipe } from "./alertas-formulario-equipe";
import { CamposFormularioEquipe, type OpcoesCamposEquipe } from "./campos-formulario-equipe";
import { ESTADO_INICIAL_EQUIPE, type EstadoEquipe } from "./estado-equipe";
import { formularioEquipeSchema, formularioEdicaoEquipeSchema, formDataDosDados, valoresDoFormulario, VALORES_PADRAO_EQUIPE, type CamposEquipe, type ValoresEquipe } from "./formulario-equipe-schema";

export type AcaoEquipe = (estado: EstadoEquipe, formData: FormData) => Promise<EstadoEquipe>;

type Props = OpcoesCamposEquipe & { acao: AcaoEquipe };

export function FormularioEquipe(props: Props) {
  const [chave, definirChave] = useState(0);

  useLayoutEffect(() => {
    return () => definirChave((anterior) => anterior + 1);
  }, []);

  return <FormularioEquipeInterno key={chave} {...props} />;
}

function FormularioEquipeInterno({ acao, ...opcoes }: Props) {
  const controle = useControleFormularioEquipe({ acao, valores: VALORES_PADRAO_EQUIPE });

  return (
    <div className="space-y-6">
      <AlertasFormularioEquipe
        conflito={controle.possuiConflito}
        ocupado={controle.ocupado} recarregando={controle.atualizandoVersao}
        carregarVersao={controle.descartarAlteracoes} erroSalvar={controle.mensagemErroGeral}
      />
      <FormularioEquipeControlado {...opcoes} controle={controle} rotuloBotao="Criar equipe" />
    </div>
  );
}

export function useControleFormularioEquipe({
  acao, valores, editando = false,
}: { acao: AcaoEquipe; valores: ValoresEquipe; editando?: boolean }) {
  const router = useRouter();
  const [estado, enviar, enviando] = useActionState(acao, ESTADO_INICIAL_EQUIPE);
  const [atualizandoVersao, iniciarRecarga] = useTransition();
  const [respostaAceita, aceitarResposta] = useState<EstadoEquipe | null>(null);
  const ultimaNotificacao = useRef<EstadoEquipe | null>(null);
  const ultimoReset = useRef<EstadoEquipe | null>(null);
  const {
    control, register, handleSubmit, reset, setValue, clearErrors,
    formState: { defaultValues, errors, isDirty, isSubmitting },
  } = useForm<CamposEquipe>({
    defaultValues: valoresDoFormulario(valores),
    resolver: zodResolver(editando ? formularioEdicaoEquipeSchema : formularioEquipeSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const versaoAtual = valores.atualizadoEm;
  const versaoBase = defaultValues?.atualizadoEm ?? versaoAtual;
  const versaoMudou = versaoBase !== versaoAtual;
  const versaoDaPropriaEdicao = estado.status === "sucesso" && estado.identificador === versaoAtual;
  const [atualizacaoExterna, definirAtualizacaoExterna] = useState({ versaoRecebida: versaoAtual, pendente: false });
  if (!enviando && atualizacaoExterna.versaoRecebida !== versaoAtual) {
    definirAtualizacaoExterna({
      versaoRecebida: versaoAtual,
      pendente: atualizacaoExterna.pendente || (isDirty && !versaoDaPropriaEdicao),
    });
  }
  const conflitoServidor = estado.status === "conflito"
    && (respostaAceita !== estado || versaoAtual === estado.versaoEnviada);
  const possuiConflito = atualizacaoExterna.pendente || conflitoServidor || atualizandoVersao;
  const ocupado = enviando || isSubmitting;
  const bloqueado = ocupado || possuiConflito || versaoMudou;
  const mensagemErroGeral = estado.status === "erro" && respostaAceita !== estado ? estado.mensagem : undefined;

  useEffect(() => {
    if (versaoMudou && !isDirty && !possuiConflito && !ocupado) reset(valoresDoFormulario(valores));
  }, [possuiConflito, isDirty, ocupado, reset, valores, versaoMudou]);

  useEffect(() => {
    if (estado.status !== "sucesso" || ultimaNotificacao.current === estado) return;
    ultimaNotificacao.current = estado;
    toast.add({ title: estado.mensagem, type: "success", timeout: 5_000 });
  }, [estado]);

  useEffect(() => {
    if (!versaoDaPropriaEdicao || possuiConflito || ultimoReset.current === estado) return;
    ultimoReset.current = estado;
    reset(valoresDoFormulario(valores));
  }, [estado, possuiConflito, reset, valores, versaoDaPropriaEdicao]);

  function ocultarErroSalvar() {
    if (estado.status === "erro") aceitarResposta(estado);
  }

  function descartarAlteracoes() {
    definirAtualizacaoExterna({ versaoRecebida: versaoAtual, pendente: false });
    reset(valoresDoFormulario(valores));
    aceitarResposta(estado);
    if (conflitoServidor) iniciarRecarga(() => router.refresh());
  }

  const aoEnviar = handleSubmit((dados) => {
    startTransition(() => enviar(formDataDosDados(dados, editando)));
  });

  return {
    aoEnviar, atualizandoVersao, bloqueado, clearErrors, control, descartarAlteracoes, enviando, enviar,
    errors, mensagemErroGeral, nomeInicial: valores.nome, ocupado, ocultarErroSalvar, possuiConflito,
    possuiRascunho: isDirty, register, setValue, versaoBase,
  };
}

export type ControleFormularioEquipe = ReturnType<typeof useControleFormularioEquipe>;

type PropsControlado = OpcoesCamposEquipe & {
  controle: ControleFormularioEquipe;
  rotuloBotao: string;
  bloqueioExterno?: boolean;
};

export function FormularioEquipeControlado({
  controle, rotuloBotao, bloqueioExterno = false, somenteLeitura, ...opcoes
}: PropsControlado) {
  const bloqueado = somenteLeitura || bloqueioExterno || controle.bloqueado;

  return (
    <form action={somenteLeitura ? undefined : controle.enviar} noValidate onSubmit={(evento) => {
      if (bloqueado) evento.preventDefault();
      else void controle.aoEnviar(evento);
    }}>
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-6">
          <CamposFormularioEquipe {...opcoes} somenteLeitura={somenteLeitura} controle={controle} bloqueado={bloqueado} />
        </CardContent>
        {!somenteLeitura && (
          <CardFooter className="justify-end">
            <Button size="lg" disabled={bloqueado} type="submit">
              {controle.enviando ? "Salvando…" : rotuloBotao}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}
