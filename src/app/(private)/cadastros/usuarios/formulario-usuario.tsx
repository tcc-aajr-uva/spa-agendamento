"use client";

import { useActionState, useState } from "react";
import { flushSync } from "react-dom";
import { CircleAlertIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Perfil } from "@/generated/prisma/client";
import { rotuloDoPerfil } from "@/lib/usuario/rotulos";
import type { EstadoCriacaoUsuario } from "./actions";
import { ResultadoConvite } from "./resultado-convite";

type Opcao = { id: string; unidadeId: string; nome: string };

type ConfiguracaoPerfil = {
  perfil: Perfil;
  tipoVinculo: "unidadeIds" | "equipeIds";
  opcoes: Opcao[];
};

type Props = {
  acao: (estado: EstadoCriacaoUsuario, formData: FormData) => Promise<EstadoCriacaoUsuario>;
  configuracoes: ConfiguracaoPerfil[];
};

export function FormularioUsuario({ acao, configuracoes }: Props) {
  const router = useRouter();
  const [versao, setVersao] = useState(0);

  const voltarParaLista = () => {
    flushSync(() => setVersao((atual) => atual + 1));
    router.push("/cadastros/usuarios");
  };

  const cadastrarOutro = () => setVersao((atual) => atual + 1);

  return (
    <FormularioUsuarioInterno
      key={`${router.bfcacheId}:${versao}`}
      acao={acao}
      cadastrarOutro={cadastrarOutro}
      configuracoes={configuracoes}
      voltarParaLista={voltarParaLista}
    />
  );
}

function FormularioUsuarioInterno({
  acao,
  cadastrarOutro,
  configuracoes,
  voltarParaLista,
}: Props & { cadastrarOutro: () => void; voltarParaLista: () => void }) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const [vinculos, setVinculos] = useState<string[]>([]);
  const [vinculoParaAdicionar, setVinculoParaAdicionar] = useState("");
  const [perfil, setPerfil] = useState(configuracoes[0]?.perfil ?? "");
  const configuracao = configuracoes.find((candidata) => candidata.perfil === perfil);
  const tipoVinculo = configuracao?.tipoVinculo ?? "unidadeIds";
  const opcoes = configuracao?.opcoes ?? [];
  const unidadeSelecionada = opcoes.find((opcao) => vinculos.includes(opcao.id))?.unidadeId;
  const opcoesDisponiveis = opcoes.filter(
    (opcao) =>
      !vinculos.includes(opcao.id) &&
      (perfil !== "ESTAGIARIO" || unidadeSelecionada === undefined || opcao.unidadeId === unidadeSelecionada),
  );
  const opcoesPerfis = configuracoes.map((opcao) => ({ value: opcao.perfil, label: rotuloDoPerfil(opcao.perfil) }));
  const itensDisponiveis = opcoesDisponiveis.map((opcao) => ({ value: opcao.id, label: opcao.nome }));

  if (estado.linkConvite && estado.expiraEm) {
    return (
      <ResultadoConvite
        cadastrarOutro={cadastrarOutro}
        expiraEm={estado.expiraEm}
        linkConvite={estado.linkConvite}
        voltarParaLista={voltarParaLista}
      />
    );
  }

  return (
    <form action={enviar}>
      <Card className="sm:[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-6">
          <FieldGroup className="gap-8">
            <FieldSet>
              <FieldLegend className="text-base font-semibold">Identificação</FieldLegend>
              <FieldDescription>Defina o perfil e os dados de acesso do novo usuário.</FieldDescription>
              <Field>
                <FieldLabel htmlFor="usuario-perfil">Perfil</FieldLabel>
                <Select
                  items={opcoesPerfis}
                  name="perfil"
                  onValueChange={(valor) => {
                    if (valor === null) return;
                    setPerfil(valor as Perfil);
                    setVinculos([]);
                    setVinculoParaAdicionar("");
                  }}
                  value={perfil}
                >
                  <SelectTrigger id="usuario-perfil" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesPerfis.map((opcao) => <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="usuario-nome">Nome</FieldLabel>
                <Input id="usuario-nome" className="h-auto px-3 py-2 leading-5 shadow-xs" name="nome" required minLength={2} maxLength={120} />
              </Field>
              <Field>
                <FieldLabel htmlFor="usuario-email">E-mail</FieldLabel>
                <Input id="usuario-email" className="h-auto px-3 py-2 leading-5 shadow-xs" name="email" type="email" required />
              </Field>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-base font-semibold">{tipoVinculo === "unidadeIds" ? "Unidades" : "Equipes"}</FieldLegend>
              <FieldDescription>Selecione os vínculos que ficarão disponíveis para este usuário.</FieldDescription>
              {opcoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Não há vínculos disponíveis para criar este perfil.</p>
              ) : (
                <Field>
                  <FieldLabel htmlFor="usuario-vinculo">Adicionar vínculo</FieldLabel>
                  <Select
                    disabled={itensDisponiveis.length === 0}
                    items={itensDisponiveis}
                    onValueChange={(valor) => {
                      if (valor) setVinculos((atuais) => [...atuais, valor]);
                      setVinculoParaAdicionar("");
                    }}
                    value={vinculoParaAdicionar}
                  >
                    <SelectTrigger id="usuario-vinculo" className="w-full px-3 leading-5 shadow-xs data-[size=default]:h-auto">
                      <SelectValue placeholder="Selecione para adicionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {itensDisponiveis.map((opcao) => <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}

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
              {opcoes.length > 0 && vinculos.length === 0 && (
                <FieldDescription>Selecione ao menos um vínculo para continuar.</FieldDescription>
              )}
              {vinculos.length > 0 && <FieldDescription>{vinculos.length} vínculo(s) selecionado(s).</FieldDescription>}
            </FieldSet>
          </FieldGroup>

          {estado.erro && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Não foi possível criar o usuário</AlertTitle>
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="lg" disabled={enviando || vinculos.length === 0} type="submit">
            {enviando ? "Criando…" : "Criar usuário e gerar convite"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

