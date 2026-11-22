"use client";

import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { aprovacaoSolicitacaoSchema, type AprovacaoSolicitacao } from "@/lib/solicitacao-acesso/dados-solicitacao";
import { erroDeUnidadeDasEquipes } from "@/lib/usuario/regras-vinculos";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import { CamposVinculosUsuario, type OpcoesVinculosUsuario } from "../usuarios/campos-vinculos-usuario";
import { CartaoLinkConvite } from "../usuarios/cartao-link-convite";
import { ESTADO_INICIAL_APROVACAO, type EstadoAprovacaoSolicitacao } from "./estado-solicitacao";
import { useFecharModal } from "./use-fechar-modal";

type Props = Pick<OpcoesVinculosUsuario, "unidades" | "equipes"> & {
  acao: (estado: EstadoAprovacaoSolicitacao, formData: FormData) => Promise<EstadoAprovacaoSolicitacao>;
  solicitacao: { nome: string; email: string; unidadeId: string };
  pendente: boolean;
};

export function FormularioAprovacao({ acao, solicitacao, pendente, unidades, equipes }: Props) {
  const fecharModal = useFecharModal("aprovar");
  const [estado, enviar, enviando] = useActionState(acao, ESTADO_INICIAL_APROVACAO);
  const aprovacaoNotificada = useRef(false);
  const [erroOculto, ocultarErro] = useState<EstadoAprovacaoSolicitacao | null>(null);
  const unidadeSolicitada = unidades.some((unidade) => unidade.id === solicitacao.unidadeId && unidade.disponivel);
  const { control, handleSubmit, setValue, trigger, formState: { errors, isSubmitting } } = useForm<AprovacaoSolicitacao>({
    defaultValues: { unidadeIds: unidadeSolicitada ? [solicitacao.unidadeId] : [], equipeIds: [] },
    resolver: zodResolver(aprovacaoSolicitacaoSchema.superRefine(({ unidadeIds, equipeIds }, contexto) => {
      const erro = erroDeUnidadeDasEquipes(unidadeIds, equipeIds, equipes);
      if (erro) contexto.addIssue({ code: "custom", path: ["equipeIds"], message: erro });
    })),
  });
  const [unidadeIds, equipeIds] = useWatch({ control, name: ["unidadeIds", "equipeIds"] });
  const erroDeUnidade = erroDeUnidadeDasEquipes(unidadeIds, equipeIds, equipes);
  const bloqueado = enviando || isSubmitting;
  const aoEnviar = handleSubmit((dados) => startTransition(() => enviar(formDataDaAprovacao(dados))));

  useEffect(() => {
    if (estado.status !== "sucesso" || aprovacaoNotificada.current) return;
    aprovacaoNotificada.current = true;
    toast.add({ title: "Solicitação aprovada", type: "success", timeout: 5_000 });
  }, [estado.status]);

  if (estado.status === "sucesso") {
    return (
      <CartaoLinkConvite
        key={estado.linkConvite}
        titulo={<><CircleCheckIcon aria-hidden="true" /> Estagiário cadastrado</>}
        descricao="Compartilhe o link abaixo para que o estagiário defina a senha."
        linkConvite={estado.linkConvite}
        validade={<>O convite poderá ser usado uma única vez e expira em {formatarDataHora(estado.expiraEm)}.</>}
        acoes={<Button type="button" onClick={fecharModal}>Voltar à lista</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="font-medium">{solicitacao.nome}</p>
        <p className="text-sm text-muted-foreground">{solicitacao.email}</p>
        <p className="text-sm text-muted-foreground">Perfil: {rotuloDoPerfil("ESTAGIARIO")}</p>
      </div>
      {!pendente ? (
        <p className="text-muted-foreground">Esta solicitação já foi analisada.</p>
      ) : (
        <>
          {estado.status === "erro" && erroOculto !== estado && (
            <AlertaErroOperacao titulo="Não foi possível aprovar a solicitação" mensagem={estado.mensagem} />
          )}
          <form noValidate onSubmit={(evento) => {
            if (bloqueado) evento.preventDefault();
            else void aoEnviar(evento);
          }}>
            <Card className="sm:[--card-spacing:--spacing(6)]">
              <CardContent>
                <FieldGroup className="gap-8">
                  <FieldSet>
                    <FieldLegend className="text-base font-semibold">Vínculos do estagiário</FieldLegend>
                    <FieldDescription>Confirme a unidade e, se quiser, vincule uma equipe. A aprovação cria o usuário e gera o convite.</FieldDescription>
                  </FieldSet>
                  <Separator />
                  <CamposVinculosUsuario perfil="ESTAGIARIO" unidades={unidades} equipes={equipes}
                    unidadeIds={unidadeIds} equipeIds={equipeIds} bloqueado={bloqueado}
                    erros={{ unidadeIds: errors.unidadeIds?.message, equipeIds: errors.equipeIds?.message }}
                    aoAlterar={(campo, ids) => {
                      setValue(campo, ids, { shouldDirty: true });
                      void trigger(["unidadeIds", "equipeIds"]);
                      if (estado.status === "erro") ocultarErro(estado);
                    }} />
                </FieldGroup>
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="lg" disabled={bloqueado || unidades.length === 0 || !!erroDeUnidade} type="submit">
                  {enviando && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
                  {enviando ? "Aprovando…" : "Aprovar e gerar convite"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </>
      )}
    </div>
  );
}

function formDataDaAprovacao(dados: AprovacaoSolicitacao): FormData {
  const formData = new FormData();
  for (const id of dados.unidadeIds ?? []) formData.append("unidadeIds", id);
  for (const id of dados.equipeIds ?? []) formData.append("equipeIds", id);
  return formData;
}

function formatarDataHora(valor: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
}
