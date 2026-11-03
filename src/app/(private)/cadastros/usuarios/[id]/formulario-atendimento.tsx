"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
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
  const [rascunho, setRascunho] = useState<{ base: Valores; liberado: boolean; limite: string } | null>(null);
  const base = rascunho?.base ?? valores;
  const liberado = rascunho?.liberado ?? valores.liberado;
  const limite = rascunho?.limite ?? String(valores.limitePacientes);
  const externo = rascunho !== null && base.versao !== valores.versao;

  return (
    <form action={enviar} className="space-y-5 rounded-lg border bg-muted/20 p-4">
      <input name="versao" type="hidden" value={base.versao ?? ""} />
      <Field orientation="horizontal">
        <Checkbox id="atendimento-liberado" name="liberado" value="on" checked={liberado} disabled={enviando}
          onCheckedChange={(marcado) => setRascunho({ base, liberado: marcado, limite })} />
        <FieldLabel htmlFor="atendimento-liberado">Liberado para atender</FieldLabel>
      </Field>
      <Field>
        <FieldLabel htmlFor="atendimento-limite">Limite de pacientes</FieldLabel>
        <Input id="atendimento-limite" className="h-auto px-3 py-2 leading-5 shadow-xs" name="limitePacientes" type="number"
          min={0} max={2_147_483_647} step={1} required value={limite} disabled={enviando}
          onChange={(evento) => setRascunho({ base, liberado, limite: evento.target.value })} />
        <FieldDescription>Com limite zero, o estagiário não recebe novos agendamentos nesta equipe. Bloquear o atendimento não cancela os agendamentos existentes.</FieldDescription>
      </Field>
      {externo && (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Configuração alterada em outra sessão</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Suas alterações locais foram preservadas.</p>
            <Button variant="outline" type="button" disabled={enviando} onClick={() => setRascunho(null)}>
              Descartar alterações locais e carregar a versão mais recente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {estado.erro && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Não foi possível salvar a configuração</AlertTitle>
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar configuração de atendimento"}
        </Button>
      </div>
    </form>
  );
}
