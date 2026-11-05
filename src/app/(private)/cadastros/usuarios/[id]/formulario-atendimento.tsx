"use client";

import { useActionState, useContext, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { DestinoAlertasAtendimento } from "./abas-usuario";
import type { EstadoAtendimento } from "./actions-atendimento";

type Valores = { liberado: boolean; limitePacientes: number; versao: string | null };
type Props = {
  acao: (estado: EstadoAtendimento, formData: FormData) => Promise<EstadoAtendimento>;
  valores: Valores;
};

export function FormularioAtendimento({ acao, ...props }: Props) {
  const [estado, enviar, enviando] = useActionState<EstadoAtendimento, FormData>(async (anterior, dados) => {
    const resultado = await acao(anterior, dados);
    return { ...resultado, confirmacao: resultado.confirmacao ?? anterior.confirmacao };
  }, {});

  useEffect(() => {
    if (!estado.sucesso) return;
    toast.add({ title: estado.sucesso, type: "success", timeout: 5_000 });
  }, [estado]);

  return <CamposAtendimento key={estado.confirmacao ?? "inicial"} {...props} estado={estado} enviar={enviar} enviando={enviando} />;
}

function CamposAtendimento({ valores, estado, enviar, enviando }: Omit<Props, "acao"> & {
  estado: EstadoAtendimento; enviar: (formData: FormData) => void; enviando: boolean;
}) {
  const router = useRouter();
  const destinoAlertas = useContext(DestinoAlertasAtendimento);
  const [recarregando, iniciarRecarga] = useTransition();
  const [conflitoAceito, aceitarConflito] = useState<EstadoAtendimento | null>(null);
  const [rascunho, setRascunho] = useState<{ base: Valores; liberado: boolean; limite: string } | null>(null);
  const base = rascunho?.base ?? valores;
  const liberado = rascunho?.liberado ?? valores.liberado;
  const limite = rascunho?.limite ?? String(valores.limitePacientes);
  const externo = rascunho !== null && base.versao !== valores.versao;
  const conflitoServidor = estado.conflito && conflitoAceito !== estado;
  const conflito = externo || conflitoServidor || recarregando;
  const bloqueado = enviando || conflito;

  function carregarVersao() {
    iniciarRecarga(() => {
      if (conflitoServidor) router.refresh();
      aceitarConflito(estado);
      setRascunho(null);
    });
  }

  return (
    <form action={enviar} className="space-y-5 rounded-lg border bg-muted/20 p-4">
      {destinoAlertas && conflito && createPortal(
        <Alert className="has-data-[slot=alert-action]:pr-2.5 sm:has-data-[slot=alert-action]:pr-32" variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Configuração alterada em outra sessão</AlertTitle>
          <AlertDescription>
            <p>
              A configuração foi atualizada depois que você abriu esta tela.
              <br />
              Carregue a versão mais recente para continuar.
            </p>
          </AlertDescription>
          <AlertAction className="static col-span-2 mt-2 flex justify-end sm:absolute sm:top-1/2 sm:right-2 sm:mt-0 sm:-translate-y-1/2">
            <Button className="h-auto max-w-full rounded-sm px-4 py-2 whitespace-normal" variant="outline" type="button"
              disabled={enviando || recarregando} onClick={carregarVersao}>
              {recarregando ? "Carregando…" : "Carregar"}
            </Button>
          </AlertAction>
        </Alert>,
        destinoAlertas,
      )}
      {destinoAlertas && estado.erro && !conflito && createPortal(
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar a configuração</AlertTitle>
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>,
        destinoAlertas,
      )}
      <input name="versao" type="hidden" value={base.versao ?? ""} />
      <Field orientation="horizontal">
        <Checkbox id="atendimento-liberado" name="liberado" value="on" checked={liberado} disabled={bloqueado}
          onCheckedChange={(marcado) => setRascunho({ base, liberado: marcado, limite })} />
        <FieldLabel htmlFor="atendimento-liberado">Liberado para atender</FieldLabel>
      </Field>
      <Field>
        <FieldLabel htmlFor="atendimento-limite">Limite de pacientes</FieldLabel>
        <Input id="atendimento-limite" className="h-auto px-3 py-2 leading-5 shadow-xs" name="limitePacientes" type="number"
          min={0} max={2_147_483_647} step={1} required value={limite} disabled={bloqueado}
          onChange={(evento) => setRascunho({ base, liberado, limite: evento.target.value })} />
        <FieldDescription>Com limite zero, o estagiário não recebe novos agendamentos nesta equipe. Bloquear o atendimento não cancela os agendamentos existentes.</FieldDescription>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={bloqueado}>
          {enviando ? "Salvando…" : "Salvar configuração de atendimento"}
        </Button>
      </div>
    </form>
  );
}
