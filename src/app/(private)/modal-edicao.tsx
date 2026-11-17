"use client";

import { Suspense, useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EVENTO_ABRIR = "abrir-modal-edicao";

type Props = {
  parametro: string;
  aberto: boolean;
  titulo: string;
  limpar: string[];
  largura?: string;
  children?: ReactNode;
};

export function ModalEdicao(props: Props) {
  return (
    <Suspense fallback={null}>
      <Modal {...props} />
    </Suspense>
  );
}

function Modal({ parametro, aberto, titulo, limpar, largura = "sm:max-w-3xl", children }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const busca = useSearchParams();
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const [transicao, setTransicao] = useState<"abrindo" | "fechando" | null>(null);
  const [abertoNoServidor, setAbertoNoServidor] = useState(aberto);

  if (abertoNoServidor !== aberto) {
    setAbertoNoServidor(aberto);
    setTransicao(null);
  }

  useEffect(() => {
    function aoAbrir(evento: Event) {
      if ((evento as CustomEvent<string>).detail === parametro) setTransicao("abrindo");
    }
    window.addEventListener(EVENTO_ABRIR, aoAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR, aoAbrir);
  }, [parametro]);

  const visivel = transicao === "abrindo" || (aberto && transicao !== "fechando");

  function fechar() {
    setTransicao("fechando");
    const parametros = new URLSearchParams(busca.toString());
    for (const chave of limpar) parametros.delete(chave);
    const consulta = parametros.toString();
    router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
  }

  return (
    <Dialog open={visivel} onOpenChange={(abrir) => !abrir && botaoFechar.current?.click()}>
      <DialogContent showCloseButton={false} className={largura}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        {aberto && transicao !== "abrindo" ? children : <IndicadorCarregando />}
        <Button
          ref={botaoFechar}
          type="button"
          variant="ghost"
          size="icon-sm"
          data-aviso-saida
          aria-label="Fechar"
          className="absolute top-3 right-3"
          onClick={fechar}
        >
          <XIcon />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

type PropsLink = ComponentProps<typeof Link> & { parametro: string };

export function LinkEdicao({ parametro, onClick, ...props }: PropsLink) {
  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    onClick?.(evento);
    if (evento.defaultPrevented || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
    window.dispatchEvent(new CustomEvent(EVENTO_ABRIR, { detail: parametro }));
  }

  return <Link scroll={false} {...props} onClick={aoClicar} />;
}

const TONS = {
  editar: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
  lista: "bg-secondary/35 text-secondary-foreground hover:bg-secondary/60 hover:text-secondary-foreground",
  acesso: "bg-foreground/8 text-foreground hover:bg-foreground/15 hover:text-foreground",
  inativar: "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
  ativar: "bg-sucesso/12 text-sucesso hover:bg-sucesso/25 hover:text-sucesso",
};

type PropsBotao = { parametro: string; href: string; rotulo: string; tom: keyof typeof TONS; children: ReactNode };

export function BotaoEdicao({ parametro, href, rotulo, tom, children }: PropsBotao) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      nativeButton={false}
      aria-label={rotulo}
      title={rotulo}
      className={TONS[tom]}
      render={<LinkEdicao parametro={parametro} href={href} prefetch={false} />}
    >
      {children}
    </Button>
  );
}
