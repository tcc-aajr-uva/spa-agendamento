"use client";

import { useState, type ReactNode } from "react";
import { CopyIcon } from "lucide-react";

import { AlertaErroOperacao } from "@/components/alerta-erro-operacao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  titulo: ReactNode;
  descricao: string;
  linkConvite: string;
  validade?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  classNameConteudo?: string;
};

export function CartaoLinkConvite({
  titulo, descricao, linkConvite, validade, acoes, className, classNameConteudo = "space-y-3",
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setErroCopia(false);
    } catch {
      setErroCopia(true);
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className={classNameConteudo}>
        <Input className="h-auto px-3 py-2 leading-5 shadow-xs" aria-label="Link do convite" readOnly value={linkConvite} />
        {validade && <p className="text-sm text-muted-foreground">{validade}</p>}
        {erroCopia && (
          <AlertaErroOperacao titulo="Não foi possível copiar o link" mensagem="Selecione o link acima e copie manualmente." />
        )}
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button variant="outline" type="button" onClick={copiar}>
          <CopyIcon aria-hidden="true" /> {copiado ? "Link copiado" : "Copiar link"}
        </Button>
        {acoes}
      </CardFooter>
    </Card>
  );
}
