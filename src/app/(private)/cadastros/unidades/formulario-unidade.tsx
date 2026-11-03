"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { formatarHora } from "@/lib/agendamento/regras";

import type { EstadoUnidade } from "./actions";

export type ValoresUnidade = {
  nome: string;
  permitePaciente: boolean;
  permiteEstagiario: boolean;
  permiteSecretaria: boolean;
  agendamentoAberto: boolean;
  horaAbertura: number;
  horaFechamento: number;
  duracaoBlocoMin: number;
  atualizadoEm?: string;
};

type Props = {
  acao: (estado: EstadoUnidade, formData: FormData) => Promise<EstadoUnidade>;
  valores?: ValoresUnidade;
  rotuloBotao: string;
  podeAlterarDadosAdministrativos?: boolean;
};

const VALORES_PADRAO: ValoresUnidade = {
  nome: "",
  permitePaciente: true,
  permiteEstagiario: true,
  permiteSecretaria: true,
  agendamentoAberto: false,
  horaAbertura: 480,
  horaFechamento: 1260,
  duracaoBlocoMin: 50,
};

export function FormularioUnidade({
  acao,
  valores = VALORES_PADRAO,
  rotuloBotao,
  podeAlterarDadosAdministrativos = true,
}: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const ultimaNotificacao = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!estado.sucesso || estado.versaoSucesso === undefined || ultimaNotificacao.current === estado.versaoSucesso) return;
    ultimaNotificacao.current = estado.versaoSucesso;
    toast.add({ title: estado.sucesso, type: "success", timeout: 5_000 });
  }, [estado.sucesso, estado.versaoSucesso]);

  return (
    <FormularioEditavel
      key={estado.versaoSucesso}
      estado={estado}
      enviar={enviar}
      enviando={enviando}
      podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
      rotuloBotao={rotuloBotao}
      valores={valores}
    />
  );
}

function FormularioEditavel({
  estado,
  enviar,
  enviando,
  valores,
  rotuloBotao,
  podeAlterarDadosAdministrativos,
}: {
  estado: EstadoUnidade;
  enviar: (formData: FormData) => void;
  enviando: boolean;
  valores: ValoresUnidade;
  rotuloBotao: string;
  podeAlterarDadosAdministrativos: boolean;
}) {
  const [alterado, setAlterado] = useState(false);
  const chaveRecebida = chaveDosValores(valores);
  const [chaveDaEdicao, setChaveDaEdicao] = useState(chaveRecebida);
  const chaveExibida = alterado ? chaveDaEdicao : chaveRecebida;
  const possuiAtualizacaoExterna = alterado && chaveDaEdicao !== chaveRecebida;

  return (
    <form
      action={enviar}
      onChange={() => {
        if (!alterado) setChaveDaEdicao(chaveRecebida);
        setAlterado(true);
      }}
    >
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-6">
          <CamposUnidade
            key={chaveExibida}
            podeAlterarDadosAdministrativos={podeAlterarDadosAdministrativos}
            valores={valores}
          />

          {possuiAtualizacaoExterna && (
            <Alert variant="warning">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>Unidade alterada em outra sessão</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Suas alterações locais foram preservadas.</p>
                <Button className="h-auto max-w-full whitespace-normal text-left" variant="outline" onClick={() => setAlterado(false)} type="button">
                  Descartar alterações locais e carregar a versão mais recente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {estado.erro && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Não foi possível salvar a unidade</AlertTitle>
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="justify-end">
          <Button size="lg" disabled={enviando} type="submit">
            {enviando ? "Salvando…" : rotuloBotao}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function CamposUnidade({
  valores,
  podeAlterarDadosAdministrativos,
}: {
  valores: ValoresUnidade;
  podeAlterarDadosAdministrativos: boolean;
}) {
  return (
    <>
      {valores.atualizadoEm && <input defaultValue={valores.atualizadoEm} name="atualizadoEm" type="hidden" />}
      <FieldGroup className="gap-8">
        <FieldSet>
          <FieldLegend className="text-base font-semibold">Identificação</FieldLegend>
          <FieldDescription>Informe o nome que identifica a unidade no sistema.</FieldDescription>
          <Field>
            <FieldLabel htmlFor="unidade-nome">Nome</FieldLabel>
            <Input
              className="h-auto px-3 py-2 leading-5 shadow-xs read-only:bg-muted"
              id="unidade-nome"
              defaultValue={valores.nome}
              maxLength={120}
              minLength={2}
              name="nome"
              readOnly={!podeAlterarDadosAdministrativos}
              required
            />
          </Field>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend className="text-base font-semibold">Permissões de agendamento</FieldLegend>
          <FieldDescription>Selecione os perfis que podem realizar agendamentos nesta unidade.</FieldDescription>
          {!podeAlterarDadosAdministrativos && (
            <FieldDescription>Somente a coordenação ou o administrador pode alterar estas permissões.</FieldDescription>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <OpcaoBooleana nome="permitePaciente" rotulo="Paciente" marcada={valores.permitePaciente} habilitada={podeAlterarDadosAdministrativos} />
            <OpcaoBooleana nome="permiteEstagiario" rotulo="Estagiário" marcada={valores.permiteEstagiario} habilitada={podeAlterarDadosAdministrativos} />
            <OpcaoBooleana nome="permiteSecretaria" rotulo="Secretaria" marcada={valores.permiteSecretaria} habilitada={podeAlterarDadosAdministrativos} />
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend className="text-base font-semibold">Funcionamento</FieldLegend>
          <FieldDescription>Defina a abertura de agendamentos, os horários de funcionamento e a duração dos blocos.</FieldDescription>
          <OpcaoBooleana nome="agendamentoAberto" rotulo="Agendamento aberto" marcada={valores.agendamentoAberto} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="unidade-abertura">Abertura</FieldLabel>
              <InputGroup className="h-auto shadow-xs">
                <InputGroupInput className="h-auto py-2 leading-5" id="unidade-abertura" defaultValue={formatarHora(valores.horaAbertura)} name="horaAbertura" required type="time" />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="unidade-fechamento">Fechamento</FieldLabel>
              <InputGroup className="h-auto shadow-xs">
                <InputGroupInput className="h-auto py-2 leading-5" id="unidade-fechamento" defaultValue={formatarHora(valores.horaFechamento)} name="horaFechamento" required type="time" />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="unidade-duracao">Duração do bloco</FieldLabel>
              <InputGroup className="h-auto shadow-xs">
                <InputGroupInput className="h-auto py-2 leading-5" id="unidade-duracao" aria-describedby="unidade-duracao-unidade" defaultValue={valores.duracaoBlocoMin} max={720} min={1} name="duracaoBlocoMin" required type="number" />
                <InputGroupAddon align="inline-end">
                  <InputGroupText id="unidade-duracao-unidade">min</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>
        </FieldSet>
      </FieldGroup>
    </>
  );
}

function OpcaoBooleana({
  nome,
  rotulo,
  marcada,
  habilitada = true,
}: {
  nome: string;
  rotulo: string;
  marcada: boolean;
  habilitada?: boolean;
}) {
  return (
    <Field orientation="horizontal" data-disabled={!habilitada}>
      {!habilitada && <input name={nome} type="hidden" value={String(marcada)} />}
      <Checkbox id={`unidade-${nome}`} defaultChecked={marcada} disabled={!habilitada} name={habilitada ? nome : undefined} value="on" />
      <FieldLabel htmlFor={`unidade-${nome}`}>{rotulo}</FieldLabel>
    </Field>
  );
}

function chaveDosValores(valores: ValoresUnidade): string {
  return [
    valores.nome,
    valores.permitePaciente,
    valores.permiteEstagiario,
    valores.permiteSecretaria,
    valores.agendamentoAberto,
    valores.horaAbertura,
    valores.horaFechamento,
    valores.duracaoBlocoMin,
    valores.atualizadoEm,
  ].join(":");
}
