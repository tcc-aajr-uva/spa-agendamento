import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

type Props = {
  pagina: number;
  total: number;
  tamanho: number;
  href: (pagina: number) => string;
};

export function Paginacao({ pagina, total, tamanho, href }: Props) {
  const ultima = Math.max(1, Math.ceil(total / tamanho));
  if (ultima === 1) return null;

  return (
    <Pagination aria-label="Paginação" className="items-center justify-between gap-4">
      {pagina > 1 ? (
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={href(pagina - 1)} />}>
          <ChevronLeftIcon data-icon="inline-start" />
          Anterior
        </Button>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        Página {pagina} de {ultima}
      </span>
      {pagina < ultima ? (
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={href(pagina + 1)} />}>
          Próxima
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      ) : (
        <span />
      )}
    </Pagination>
  );
}
