"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { IndicadorCarregando } from "@/components/indicador-carregando";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EVENTO_ABRIR = "abrir-modal-edicao";
type AberturaModal = { parametro: string; origem: HTMLAnchorElement };

type Props = {
  parametro: string;
  aberto: boolean;
  titulo: string;
  limpar: string[];
  largura?: string;
  visaoInterna?: {
    parametro: string;
    aberta: boolean;
    titulo: string;
    hrefRetorno: string;
    conteudo: ReactNode;
  };
  children?: ReactNode;
};

export function ModalEdicao(props: Props) {
  return (
    <Suspense fallback={null}>
      <Modal {...props} />
    </Suspense>
  );
}

function Modal({ parametro, aberto, titulo, limpar, largura = "sm:max-w-3xl", visaoInterna, children }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const busca = useSearchParams();
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const rolagemPrincipal = useRef(0);
  const origemVisao = useRef<AberturaModal["origem"] | null>(null);
  const hrefOrigemVisao = useRef<string | null>(null);
  const [transicao, setTransicao] = useState<"abrindo" | "fechando" | null>(null);
  const [abertoNoServidor, setAbertoNoServidor] = useState(aberto);
  const [transicaoInterna, setTransicaoInterna] = useState<"abrindo" | "fechando" | null>(null);
  const [visaoInternaNoServidor, setVisaoInternaNoServidor] = useState(Boolean(visaoInterna?.aberta));
  const visaoAnterior = useRef(Boolean(visaoInterna?.aberta));

  if (abertoNoServidor !== aberto) {
    setAbertoNoServidor(aberto);
    setTransicao(null);
    setTransicaoInterna(null);
  }

  if (visaoInternaNoServidor !== Boolean(visaoInterna?.aberta)) {
    setVisaoInternaNoServidor(Boolean(visaoInterna?.aberta));
    setTransicaoInterna(null);
  }

  useEffect(() => {
    function aoAbrir(evento: Event) {
      const abertura = (evento as CustomEvent<AberturaModal>).detail;
      if (abertura.parametro === parametro) setTransicao("abrindo");
      else if (visaoInterna && abertura.parametro === visaoInterna.parametro) {
        rolagemPrincipal.current = conteudo.current?.scrollTop ?? 0;
        origemVisao.current = abertura.origem;
        hrefOrigemVisao.current = abertura.origem.getAttribute("href");
        setTransicaoInterna("abrindo");
      }
    }
    window.addEventListener(EVENTO_ABRIR, aoAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR, aoAbrir);
  }, [parametro, visaoInterna]);

  const visivel = transicao === "abrindo" || (aberto && transicao !== "fechando");
  const mostrarVisaoInterna = Boolean(visaoInterna) && (transicaoInterna === "abrindo" || (visaoInternaNoServidor && transicaoInterna !== "fechando"));

  useLayoutEffect(() => {
    if (visaoAnterior.current === mostrarVisaoInterna && (mostrarVisaoInterna || visaoInternaNoServidor || !origemVisao.current)) return;
    visaoAnterior.current = mostrarVisaoInterna;
    if (mostrarVisaoInterna) {
      if (conteudo.current) conteudo.current.scrollTop = 0;
      conteudo.current?.focus({ preventScroll: true });
    } else {
      if (conteudo.current) conteudo.current.scrollTop = rolagemPrincipal.current;
      const destino = origemVisao.current?.isConnected ? origemVisao.current
        : Array.from(conteudo.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])
          .find((link) => link.getAttribute("href") === hrefOrigemVisao.current);
      (destino ?? conteudo.current)?.focus({ preventScroll: true });
    }
  }, [mostrarVisaoInterna, visaoInternaNoServidor]);

  function fechar() {
    if (mostrarVisaoInterna && visaoInterna) {
      setTransicaoInterna("fechando");
      router.replace(visaoInterna.hrefRetorno, { scroll: false });
      return;
    }
    setTransicao("fechando");
    const parametros = new URLSearchParams(busca.toString());
    for (const chave of limpar) parametros.delete(chave);
    const consulta = parametros.toString();
    const destino = consulta ? `${caminho}?${consulta}` : caminho;
    router.replace(destino, { scroll: false });
  }

  return (
    <Dialog open={visivel} onOpenChange={(abrir) => !abrir && botaoFechar.current?.click()}>
      <DialogContent ref={conteudo} showCloseButton={false} className={largura}
        onScroll={(evento) => { if (!mostrarVisaoInterna) rolagemPrincipal.current = evento.currentTarget.scrollTop; }}>
        <DialogHeader>
          <DialogTitle>{mostrarVisaoInterna ? visaoInterna?.titulo : titulo}</DialogTitle>
        </DialogHeader>
        {aberto && transicao !== "abrindo" ? <>
          <div hidden={mostrarVisaoInterna}>{children}</div>
          {mostrarVisaoInterna && <div>{transicaoInterna === "abrindo" ? <IndicadorCarregando /> : visaoInterna?.conteudo}</div>}
        </> : <IndicadorCarregando />}
        <Button
          ref={botaoFechar}
          type="button"
          variant="ghost"
          size="icon-sm"
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
    window.dispatchEvent(new CustomEvent<AberturaModal>(EVENTO_ABRIR, { detail: { parametro, origem: evento.currentTarget } }));
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
