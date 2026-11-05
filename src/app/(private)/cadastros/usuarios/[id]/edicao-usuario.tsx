"use client";

import { startTransition, useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import { AlertasFormularioUsuario } from "../alertas-formulario-usuario";
import { ESTADO_INICIAL_USUARIO, type EstadoEdicaoUsuario } from "../estado-usuario";
import { formDataDoUsuario, formularioEdicaoUsuarioSchema, type CamposEdicaoUsuario } from "../formulario-usuario-schema";
import { AbasUsuario } from "./abas-usuario";
import { ControleAtivacaoUsuario } from "./controle-ativacao";
import { FormularioEdicaoUsuario, type OpcoesEdicaoUsuario } from "./formulario-edicao";

type Acao = (estado: EstadoEdicaoUsuario, dados: FormData) => Promise<EstadoEdicaoUsuario>;
type Props = OpcoesEdicaoUsuario & {
  valores: CamposEdicaoUsuario;
  ativo: boolean;
  podeAlterarAcesso: boolean;
  acaoAtualizar: Acao;
  acaoAtivacao: Acao;
  atendimento?: ReactNode;
  convite: ReactNode;
};

export function EdicaoUsuario(props: Props) {
  const [chave, definirChave] = useState(0);
  useLayoutEffect(() => () => definirChave((anterior) => anterior + 1), []);
  return <EdicaoUsuarioInterna key={chave} {...props} />;
}

function EdicaoUsuarioInterna({ valores, ativo, podeAlterarAcesso, acaoAtualizar, acaoAtivacao, atendimento, convite, ...opcoes }: Props) {
  const router = useRouter();
  const [estado, enviar, enviando] = useActionState(acaoAtualizar, ESTADO_INICIAL_USUARIO);
  const [ativacao, executarAtivacao, alterando] = useActionState(acaoAtivacao, ESTADO_INICIAL_USUARIO);
  const [recarregando, iniciarRecarga] = useTransition();
  const [edicaoAceita, aceitarEdicao] = useState<EstadoEdicaoUsuario | null>(null);
  const [ativacaoAceita, aceitarAtivacao] = useState<EstadoEdicaoUsuario | null>(null);
  const ultimaEdicao = useRef<EstadoEdicaoUsuario | null>(null);
  const ultimaAtivacao = useRef<EstadoEdicaoUsuario | null>(null);

  const formulario = useForm<CamposEdicaoUsuario>({ defaultValues: valores, resolver: zodResolver(formularioEdicaoUsuarioSchema) });
  const { control, handleSubmit, reset, formState: { defaultValues, errors, isDirty, isSubmitting } } = formulario;
  const vinculos = useWatch({ control, name: opcoes.tipoVinculo });
  const versao = valores.atualizadoEm;
  const mudou = defaultValues?.atualizadoEm !== versao;
  const versaoSalva = estado.status === "sucesso" && estado.identificador === versao;
  const [atualizacaoExterna, definirAtualizacaoExterna] = useState({ versao, pendente: false });
  if (!enviando && atualizacaoExterna.versao !== versao) {
    definirAtualizacaoExterna({ versao, pendente: atualizacaoExterna.pendente || (isDirty && !versaoSalva) });
  }

  const conflitoEdicao = estado.status === "conflito" && (edicaoAceita !== estado || estado.versaoEnviada === versao);
  const conflitoAtivacao = ativacao.status === "conflito" && (ativacaoAceita !== ativacao || ativacao.versaoEnviada === versao);
  const conflito = atualizacaoExterna.pendente || conflitoEdicao || conflitoAtivacao || recarregando;
  const ocupado = enviando || alterando || isSubmitting;
  const bloqueado = ocupado || conflito || mudou;

  useEffect(() => {
    if (!conflito && !ocupado && !isDirty && mudou) reset(valores);
  }, [conflito, isDirty, mudou, ocupado, reset, valores]);

  useEffect(() => {
    if (!versaoSalva || conflito || ocupado || estado.status !== "sucesso" || ultimaEdicao.current === estado) return;
    ultimaEdicao.current = estado;
    reset(valores);
    toast.add({ title: estado.mensagem, type: "success", timeout: 5_000 });
  }, [conflito, estado, ocupado, reset, valores, versaoSalva]);

  useEffect(() => {
    if (ativacao.status !== "sucesso" || ultimaAtivacao.current === ativacao) return;
    ultimaAtivacao.current = ativacao;
    toast.add({ title: ativacao.mensagem, type: "success", timeout: 5_000 });
  }, [ativacao]);

  function carregarVersao() {
    reset(valores);
    definirAtualizacaoExterna({ versao, pendente: false });
    aceitarEdicao(estado);
    aceitarAtivacao(ativacao);
    if (conflitoEdicao || conflitoAtivacao) iniciarRecarga(() => router.refresh());
  }

  const aoEnviar = handleSubmit((dados) => startTransition(() => enviar(formDataDoUsuario(dados))));

  return (
    <div className="space-y-6">
      <AlertasFormularioUsuario conflito={conflito} ocupado={ocupado}
        recarregando={recarregando} carregarVersao={carregarVersao} erroVersao={errors.atualizadoEm?.message}
        erroSalvar={estado.status === "erro" && edicaoAceita !== estado ? estado.mensagem : undefined}
        erroAtivacao={ativacao.status === "erro" && ativacaoAceita !== ativacao ? ativacao.mensagem : undefined} />
      <AbasUsuario bloqueada={conflito} atendimento={atendimento} convite={convite} dados={
        <>
          <FormularioEdicaoUsuario {...opcoes} formulario={formulario} valores={valores} vinculos={vinculos}
            acao={enviar} bloqueado={bloqueado} enviando={enviando}
            aoAlterar={() => { if (estado.status === "erro") aceitarEdicao(estado); }}
            aoEnviar={(evento) => { if (bloqueado) evento.preventDefault(); else void aoEnviar(evento); }} />
          {podeAlterarAcesso ? (
            <ControleAtivacaoUsuario executar={executarAtivacao} executando={alterando} ativo={ativo} atualizadoEm={versao}
              bloqueado={bloqueado || isDirty} bloqueadoPorRascunho={isDirty && !conflito} />
          ) : (
            <Alert>
              <InfoIcon aria-hidden="true" />
              <AlertTitle>Alteração de acesso indisponível</AlertTitle>
              <AlertDescription>
                O acesso global só pode ser alterado pelo administrador ou por uma coordenação responsável por todas as unidades deste usuário.
              </AlertDescription>
            </Alert>
          )}
        </>
      } />
    </div>
  );
}
