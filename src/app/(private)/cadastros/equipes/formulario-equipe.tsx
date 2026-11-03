"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { chaveDaEquipe, type VersaoEquipe } from "@/lib/equipe/dados-equipe";
import type { EstadoEquipe } from "./actions";

type Props = {
  acao: (estado: EstadoEquipe, formData: FormData) => Promise<EstadoEquipe>;
  unidades?: { id: string; nome: string }[];
  unidadeFixa?: string;
  supervisores: { id: string; nome: string; email: string; unidadeIds: string[]; qualquerUnidade: boolean }[];
  supervisorAtualNome?: string;
  somenteLeitura?: boolean;
  valores?: VersaoEquipe;
};

const VALORES_PADRAO: VersaoEquipe = { nome: "", unidadeId: "", ativa: true, supervisorId: null };

export function FormularioEquipe({ acao, valores = VALORES_PADRAO, ...props }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const ultimaNotificacao = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!estado.sucesso || estado.versaoSucesso === undefined || ultimaNotificacao.current === estado.versaoSucesso) return;
    ultimaNotificacao.current = estado.versaoSucesso;
    toast.add({ title: estado.sucesso, type: "success", timeout: 5_000 });
  }, [estado.sucesso, estado.versaoSucesso]);

  return <FormularioEditavel key={estado.versaoSucesso} {...props} valores={valores} estado={estado} enviar={enviar} enviando={enviando} />;
}

function FormularioEditavel({
  valores, unidades = [], unidadeFixa, supervisores, supervisorAtualNome, somenteLeitura = false, estado, enviar, enviando,
}: Omit<Props, "acao" | "valores"> & {
  valores: VersaoEquipe;
  estado: EstadoEquipe;
  enviar: (formData: FormData) => void;
  enviando: boolean;
}) {
  const [rascunho, setRascunho] = useState<{ base: VersaoEquipe; nome: string; unidadeId: string; supervisorId: string | null } | null>(null);
  const base = rascunho?.base ?? valores;
  const nome = rascunho?.nome ?? valores.nome;
  const unidadeId = rascunho?.unidadeId ?? valores.unidadeId;
  const supervisorId = rascunho ? rascunho.supervisorId : valores.supervisorId;
  const supervisoresDisponiveis = supervisores.filter((supervisor) => supervisor.qualquerUnidade || supervisor.unidadeIds.includes(unidadeId));
  const responsavelIndisponivel = supervisorId !== null && !supervisoresDisponiveis.some((supervisor) => supervisor.id === supervisorId);
  const atualizadaExternamente = rascunho !== null && chaveDaEquipe(base) !== chaveDaEquipe(valores);
  const opcoesUnidades = unidades.map((unidade) => ({ value: unidade.id, label: unidade.nome }));
  const opcoesSupervisores = [
    { value: "", label: "Sem supervisor responsável" },
    ...(responsavelIndisponivel && supervisorId
      ? [{
          value: supervisorId,
          label: `${supervisorAtualNome ?? "Responsável anterior"}${somenteLeitura ? "" : " (indisponível para nova atribuição)"}`,
        }]
      : []),
    ...supervisoresDisponiveis.map((supervisor) => ({
      value: supervisor.id,
      label: `${supervisor.nome} — ${supervisor.email}`,
    })),
  ];

  return (
    <form action={somenteLeitura ? undefined : enviar}
      onSubmit={(evento) => { if (somenteLeitura) evento.preventDefault(); }}>
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-6">
          <FieldGroup className="gap-8">
            <FieldSet>
              <FieldLegend className="text-base font-semibold">Identificação</FieldLegend>
              <FieldDescription>Informe a unidade e o nome que identificam a equipe no sistema.</FieldDescription>
              <div className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="equipe-unidade">Unidade</FieldLabel>
                  {unidadeFixa ? (
                    <>
                      <Input id="equipe-unidade" className="h-auto px-3 py-2 leading-5 shadow-xs" value={unidadeFixa} readOnly disabled />
                      <input type="hidden" name="versao" value={chaveDaEquipe(base)} />
                    </>
                  ) : (
                    <Select
                      disabled={enviando || somenteLeitura}
                      items={opcoesUnidades}
                      name="unidadeId"
                      onValueChange={(valor) => setRascunho({ base, nome, unidadeId: valor ?? "", supervisorId: null })}
                      required
                      value={unidadeId}
                    >
                      <SelectTrigger id="equipe-unidade" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcoesUnidades.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="equipe-nome">Nome da equipe</FieldLabel>
                  <Input
                    className="h-auto px-3 py-2 leading-5 shadow-xs"
                    disabled={enviando || somenteLeitura}
                    id="equipe-nome"
                    maxLength={120}
                    minLength={2}
                    name="nome"
                    onChange={(evento) => setRascunho({ base, nome: evento.target.value, unidadeId, supervisorId })}
                    required
                    value={nome}
                  />
                </Field>
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-base font-semibold">Supervisão</FieldLegend>
              <FieldDescription>Selecione um supervisor existente ou deixe a equipe sem responsável.</FieldDescription>
              <Field>
                <FieldLabel htmlFor="equipe-supervisor">Supervisor responsável (opcional)</FieldLabel>
                <Select
                  disabled={enviando || !unidadeId || somenteLeitura}
                  items={opcoesSupervisores}
                  name="supervisorId"
                  onValueChange={(valor) => setRascunho({ base, nome, unidadeId, supervisorId: valor || null })}
                  value={supervisorId ?? ""}
                >
                  <SelectTrigger id="equipe-supervisor" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                    <SelectValue placeholder="Sem supervisor responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesSupervisores.map((opcao) => (
                      <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!somenteLeitura && <FieldDescription>Novos supervisores podem ser cadastrados em Usuários.</FieldDescription>}
              </Field>
            </FieldSet>
          </FieldGroup>

          {atualizadaExternamente && (
            <Alert variant="warning">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>Equipe alterada em outra sessão</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Suas alterações locais foram preservadas.</p>
                <Button className="h-auto max-w-full whitespace-normal text-left" variant="outline" type="button" disabled={enviando} onClick={() => setRascunho(null)}>
                  Descartar alterações locais e carregar a versão mais recente
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {estado.erro && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Não foi possível salvar a equipe</AlertTitle>
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        {!somenteLeitura && (
          <CardFooter className="justify-end">
            <Button size="lg" disabled={enviando} type="submit">
              {enviando ? "Salvando…" : unidadeFixa ? "Salvar alterações" : "Criar equipe"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}
