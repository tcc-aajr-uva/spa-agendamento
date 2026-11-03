"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleAlertIcon, InfoIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import type { EstadoEdicaoUsuario } from "./actions";

type Opcao = { id: string; unidadeId: string; nome: string; disponivel: boolean };

type Props = {
  acao: (estado: EstadoEdicaoUsuario, formData: FormData) => Promise<EstadoEdicaoUsuario>;
  nome: string;
  opcoes: Opcao[];
  tipoVinculo: "unidadeIds" | "equipeIds";
  vinculosIniciais: string[];
  restringirEquipesAUmaUnidade: boolean;
  possuiVinculosForaDoEscopo: boolean;
};

export function FormularioEdicaoUsuario({
  acao,
  nome,
  opcoes,
  tipoVinculo,
  vinculosIniciais,
  restringirEquipesAUmaUnidade,
  possuiVinculosForaDoEscopo,
}: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [vinculos, setVinculos] = useState(vinculosIniciais);
  const [vinculoParaAdicionar, setVinculoParaAdicionar] = useState("");
  const unidadeSelecionada = opcoes.find((opcao) => vinculos.includes(opcao.id))?.unidadeId;
  const opcoesDisponiveis = opcoes.filter(
    (opcao) =>
      opcao.disponivel &&
      !vinculos.includes(opcao.id) &&
      (!restringirEquipesAUmaUnidade || unidadeSelecionada === undefined || opcao.unidadeId === unidadeSelecionada),
  );
  const itensDisponiveis = opcoesDisponiveis.map((opcao) => ({ value: opcao.id, label: opcao.nome }));

  useEffect(() => {
    if (!estado.sucesso) return;
    toast.add({ title: estado.sucesso, type: "success", timeout: 5_000 });
  }, [estado]);

  return (
    <form action={enviar}>
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-6">
          <FieldGroup className="gap-8">
            <FieldSet>
              <FieldLegend className="text-base font-semibold">Dados pessoais</FieldLegend>
              <FieldDescription>Atualize o nome usado para identificar o usuário.</FieldDescription>
              <Field>
                <FieldLabel htmlFor="usuario-edicao-nome">Nome</FieldLabel>
                <Input id="usuario-edicao-nome" className="h-auto px-3 py-2 leading-5 shadow-xs"
                  defaultValue={nome} maxLength={120} minLength={2} name="nome" required />
              </Field>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-base font-semibold">Vínculos no seu escopo</FieldLegend>
              <FieldDescription>Gerencie as {tipoVinculo === "unidadeIds" ? "unidades" : "equipes"} disponíveis para este usuário.</FieldDescription>
              {possuiVinculosForaDoEscopo && (
                <Alert>
                  <InfoIcon aria-hidden="true" />
                  <AlertTitle>Existem vínculos fora do seu escopo</AlertTitle>
                  <AlertDescription>Eles não são exibidos nesta tela e serão preservados.</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="usuario-edicao-vinculo">Adicionar vínculo</FieldLabel>
                <Select
                  disabled={itensDisponiveis.length === 0}
                  items={itensDisponiveis}
                  onValueChange={(valor) => {
                    if (valor) setVinculos((atuais) => [...atuais, valor]);
                    setVinculoParaAdicionar("");
                  }}
                  value={vinculoParaAdicionar}
                >
                  <SelectTrigger id="usuario-edicao-vinculo" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                    <SelectValue placeholder="Selecione para adicionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {itensDisponiveis.map((opcao) => <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <div className="space-y-2">
                {vinculos.map((id) => {
                  const opcao = opcoes.find((candidata) => candidata.id === id);
                  if (!opcao) return null;
                  return (
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2" key={id}>
                      <input name={tipoVinculo} type="hidden" value={id} />
                      <span className="text-sm font-medium">{opcao.nome}</span>
                      <Button aria-label={`Remover ${opcao.nome}`} size="sm" variant="ghost"
                        onClick={() => setVinculos((atuais) => atuais.filter((vinculoId) => vinculoId !== id))} type="button">
                        <XIcon aria-hidden="true" /> Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
              {vinculos.length === 0 && (
                <FieldDescription>O usuário ficará sem vínculos dentro do seu escopo.</FieldDescription>
              )}
            </FieldSet>
          </FieldGroup>

          {estado.erro && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Não foi possível salvar o usuário</AlertTitle>
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="lg" disabled={enviando} type="submit">
            {enviando ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
