"use client";

import { useState } from "react";
import { CircleAlertIcon, CircleCheckIcon, CopyIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  expiraEm: string;
  linkConvite: string;
  cadastrarOutro: () => void;
  voltarParaLista: () => void;
};

export function ResultadoConvite({ expiraEm, linkConvite, cadastrarOutro, voltarParaLista }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setErroCopia(false);
    } catch {
      setErroCopia(true);
    }
  };

  return (
    <Card className="sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CircleCheckIcon aria-hidden="true" /> Usuário criado</CardTitle>
        <CardDescription>Compartilhe o link abaixo para que a pessoa defina sua senha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input className="h-auto px-3 py-2 leading-5 shadow-xs" aria-label="Link do convite" readOnly value={linkConvite} />
        <p className="text-sm text-muted-foreground">
          O convite poderá ser usado uma única vez e expira em {formatarData(expiraEm)}.
        </p>
        {erroCopia && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Não foi possível copiar o link</AlertTitle>
            <AlertDescription>Selecione o link acima e copie manualmente.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button variant="outline" type="button" onClick={copiar}>
          <CopyIcon aria-hidden="true" /> {copiado ? "Link copiado" : "Copiar link"}
        </Button>
        <Button variant="outline" type="button" onClick={cadastrarOutro}>Cadastrar outro</Button>
        <Button type="button" onClick={voltarParaLista}>Voltar à lista</Button>
      </CardFooter>
    </Card>
  );
}

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}
