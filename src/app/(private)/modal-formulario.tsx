"use client";

import { Suspense, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  rotulo: string;
  titulo: string;
  descricao?: string;
  variante?: ComponentProps<typeof Button>["variant"];
  tamanho?: ComponentProps<typeof Button>["size"];
  atualizarAoFechar?: boolean;
  children: ReactNode;
};

export function ModalFormulario({ rotulo, titulo, descricao, variante = "default", tamanho = "lg", atualizarAoFechar, children }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const botaoFechar = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => () => setAberto(false), []);

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => (abrir ? setAberto(true) : botaoFechar.current?.click())}
      onOpenChangeComplete={(abrir) => !abrir && atualizarAoFechar && router.refresh()}
    >
      <DialogTrigger render={<Button variant={variante} size={tamanho} />}>{rotulo}</DialogTrigger>
      {aberto && (
        <Suspense fallback={null}>
          <FecharAoMudarUrl aoMudar={() => setAberto(false)} />
        </Suspense>
      )}
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:ring-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-footer]]:border-0 [&_[data-slot=card-footer]]:bg-transparent [&_[data-slot=card-footer]]:px-0"
      >
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>
        {children}
        <Button
          ref={botaoFechar}
          type="button"
          variant="ghost"
          size="icon-sm"
          data-aviso-saida
          aria-label="Fechar"
          className="absolute top-3 right-3"
          onClick={() => setAberto(false)}
        >
          <XIcon />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function FecharAoMudarUrl({ aoMudar }: { aoMudar: () => void }) {
  const busca = useSearchParams().toString();
  const [buscaInicial] = useState(busca);
  const avisar = useEffectEvent(aoMudar);

  useEffect(() => {
    if (busca !== buscaInicial) avisar();
  }, [busca, buscaInicial]);

  return null;
}
