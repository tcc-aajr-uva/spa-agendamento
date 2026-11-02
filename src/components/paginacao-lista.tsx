import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";

type Props = {
  pagina: number;
  totalPaginas: number;
  total: number;
  rotuloTotal: string;
  ariaLabel?: string;
  href: (pagina: number) => string;
};

export function PaginacaoLista({ pagina, totalPaginas, total, rotuloTotal, ariaLabel = "Paginação", href }: Props) {
  return (
    <Pagination aria-label={ariaLabel}>
      <PaginationContent className="grid w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2">
        <PaginationItem className="justify-self-start">
          {pagina > 1 ? (
            <PaginationLink size="default" aria-label="Ir para a página anterior" href={href(pagina - 1)} prefetch={false}>
              Anterior
            </PaginationLink>
          ) : <Button type="button" variant="ghost" disabled>Anterior</Button>}
        </PaginationItem>
        <PaginationItem className="text-center text-xs text-muted-foreground">
          Página {pagina} de {totalPaginas} — {total} {rotuloTotal}
        </PaginationItem>
        <PaginationItem className="justify-self-end">
          {pagina < totalPaginas ? (
            <PaginationLink size="default" aria-label="Ir para a próxima página" href={href(pagina + 1)} prefetch={false}>
              Próxima
            </PaginationLink>
          ) : <Button type="button" variant="ghost" disabled>Próxima</Button>}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
