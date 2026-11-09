"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

import { AlertasFormularioUnidade } from "./alertas-formulario-unidade";
import { CamposFormularioUnidade } from "./campos-formulario-unidade";
import { ESTADO_INICIAL_UNIDADE, type EstadoUnidade } from "./estado-unidade";
import {
  chaveDosValores,
  formDataDosDados,
  formularioUnidadeSchema,
  valoresDoFormulario,
  type CamposFormularioUnidade as CamposFormulario,
  type DadosFormularioUnidade,
  type ValoresUnidade,
} from "./formulario-unidade-schema";

export type { ValoresUnidade } from "./formulario-unidade-schema";

export type AcaoUnidade = (
  estado: EstadoUnidade,
  formData: FormData,
) => Promise<EstadoUnidade>;

type Props = {
  acao: AcaoUnidade;
  valores: ValoresUnidade;
  rotuloBotao: string;
  podeAlterarDadosAdministrativos?: boolean;
};

export function FormularioUnidade(props: Props) {
  const [chaveDoFormulario, setChaveDoFormulario] = useState(0);

  useLayoutEffect(() => {
    return () => setChaveDoFormulario((chaveAtual) => chaveAtual + 1);
  }, []);

  return <FormularioUnidadeInterno key={chaveDoFormulario} {...props} />;
}

function FormularioUnidadeInterno({
  acao,
  valores,
  rotuloBotao,
  podeAlterarDadosAdministrativos = true,
}: Props) {
  const controle = useControleFormularioUnidade({ acao, valores });

  return (
    <div className="space-y-6">
      <AlertasFormularioUnidade
        atualizandoVersao={controle.atualizandoVersao}
        mensagemErroVersao={controle.mensagemErroVersao}
        mensagensErrosGerais={
          controle.mensagemErroGeral ? [controle.mensagemErroGeral] : undefined
        }
        onCarregarVersao={controle.descartarAlteracoes}
        possuiConflito={controle.possuiConflito}
      />
      <FormularioUnidadeControlado
        controle={controle}
        podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
        rotuloBotao={rotuloBotao}
      />
    </div>
  );
}

export function useControleFormularioUnidade({
  acao,
  valores,
}: Pick<Props, "acao" | "valores">) {
  const router = useRouter();
  const [estado, enviar, enviando] = useActionState(acao, ESTADO_INICIAL_UNIDADE);
  const [atualizandoVersao, iniciarAtualizacao] = useTransition();
  const ultimaNotificacao = useRef<string | undefined>(undefined);
  const [estadoComErroOculto, setEstadoComErroOculto] =
    useState<EstadoUnidade | null>(null);
  const [versaoAntesDoDescarte, setVersaoAntesDoDescarte] =
    useState<string | null>(null);
  const chaveRecebida = chaveDosValores(valores);
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<CamposFormulario, unknown, DadosFormularioUnidade>({
    defaultValues: valoresDoFormulario(valores),
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(formularioUnidadeSchema),
  });
  const versaoEmEdicao = useWatch({ control, name: "atualizadoEm" });
  const [atualizacaoExterna, setAtualizacaoExterna] = useState({
    pendente: false,
    versaoRecebida: valores.atualizadoEm,
  });
  if (atualizacaoExterna.versaoRecebida !== valores.atualizadoEm) {
    const versaoDaPropriaAtualizacao =
      estado.status === "sucesso" &&
      estado.identificador === valores.atualizadoEm;
    setAtualizacaoExterna({
      pendente:
        atualizacaoExterna.pendente ||
        (isDirty && !versaoDaPropriaAtualizacao),
      versaoRecebida: valores.atualizadoEm,
    });
  }
  const possuiAtualizacaoExterna = atualizacaoExterna.pendente;

  useEffect(() => {
    if (isDirty) return;
    reset(valoresDoFormulario(valores));
  }, [chaveRecebida, isDirty, reset, valores]);

  useEffect(() => {
    if (
      estado.status !== "sucesso" ||
      ultimaNotificacao.current === estado.identificador
    )
      return;
    ultimaNotificacao.current = estado.identificador;
    reset(valoresDoFormulario(valores));
    toast.add({ title: estado.mensagem, type: "success", timeout: 5_000 });
  }, [chaveRecebida, estado, reset, valores]);

  const ocultarErro = estadoComErroOculto === estado;
  const descarteConcluido =
    ocultarErro &&
    versaoAntesDoDescarte !== null &&
    valores.atualizadoEm !== versaoAntesDoDescarte;
  const possuiConflito =
    (estado.status === "conflito" && !descarteConcluido) ||
    possuiAtualizacaoExterna;
  const aoEnviar = handleSubmit((dadosValidados) => {
    startTransition(() => enviar(formDataDosDados(dadosValidados)));
  });

  function descartarAlteracoes() {
    setAtualizacaoExterna({
      pendente: false,
      versaoRecebida: valores.atualizadoEm,
    });
    setVersaoAntesDoDescarte(versaoEmEdicao);
    reset(valoresDoFormulario(valores));
    setEstadoComErroOculto(estado);
    if (estado.status === "conflito") {
      iniciarAtualizacao(() => router.refresh());
    }
  }

  return {
    aoAlterarFormulario() {
      if (estado.status === "erro") setEstadoComErroOculto(estado);
    },
    aoEnviar,
    atualizandoVersao,
    control,
    descartarAlteracoes,
    enviar,
    enviando,
    errors,
    mensagemErroGeral:
      estado.status === "erro" && !ocultarErro ? estado.mensagem : undefined,
    mensagemErroVersao: errors.atualizadoEm?.message,
    possuiConflito,
    possuiRascunho: isDirty,
    register,
  };
}

export type ControleFormularioUnidade = ReturnType<
  typeof useControleFormularioUnidade
>;

export function FormularioUnidadeControlado({
  bloqueioExterno = false,
  controle,
  rotuloBotao,
  podeAlterarDadosAdministrativos = true,
}: {
  bloqueioExterno?: boolean;
  controle: ControleFormularioUnidade;
  rotuloBotao: string;
  podeAlterarDadosAdministrativos?: boolean;
}) {
  const {
    aoAlterarFormulario,
    aoEnviar,
    atualizandoVersao,
    control,
    enviar,
    enviando,
    errors,
    possuiConflito,
    register,
  } = controle;
  const bloqueado =
    enviando || possuiConflito || atualizandoVersao || bloqueioExterno;

  return (
    <form
      action={enviar}
      onChange={aoAlterarFormulario}
      onSubmit={aoEnviar}
      noValidate
    >
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-6">
          <fieldset className="m-0 min-w-0 border-0 p-0" disabled={bloqueado}>
            <CamposFormularioUnidade
              bloqueada={bloqueado}
              control={control}
              errors={errors}
              podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
              register={register}
            />
          </fieldset>
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="lg" disabled={bloqueado} type="submit">
            {enviando ? "Salvando…" : rotuloBotao}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
