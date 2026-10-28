import Link from "next/link";

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
    <nav className="flex items-center gap-4 text-sm">
      {pagina > 1 && (
        <Link className="underline" href={href(pagina - 1)}>
          Anterior
        </Link>
      )}
      <span>
        Página {pagina} de {ultima}
      </span>
      {pagina < ultima && (
        <Link className="underline" href={href(pagina + 1)}>
          Próxima
        </Link>
      )}
    </nav>
  );
}
