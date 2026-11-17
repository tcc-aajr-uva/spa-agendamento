import type { LucideIcon } from "lucide-react";

const TONS = {
  atencao: {
    cartao: "from-secondary/25 border-secondary/60 before:bg-secondary",
    icone: "bg-secondary text-secondary-foreground shadow-secondary/40",
    valor: "text-atencao",
  },
  primario: {
    cartao: "from-primary/15 border-primary/30 before:bg-primary",
    icone: "bg-primary/15 text-primary shadow-primary/20",
    valor: "text-primary",
  },
  sucesso: {
    cartao: "from-sucesso/15 border-sucesso/30 before:bg-sucesso",
    icone: "bg-sucesso/15 text-sucesso shadow-sucesso/20",
    valor: "text-sucesso",
  },
  espera: {
    cartao: "from-espera/15 border-espera/30 before:bg-espera",
    icone: "bg-espera/15 text-espera shadow-espera/20",
    valor: "text-espera",
  },
};

type Props = {
  titulo: string;
  valor: number;
  detalhe: string;
  icone: LucideIcon;
  tom: keyof typeof TONS;
};

export function CartaoResumo({ titulo, valor, detalhe, icone: Icone, tom }: Props) {
  const estilo = TONS[tom];
  return (
    <div
      className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card bg-linear-to-br to-card to-70% p-6 shadow-sm transition-[translate,box-shadow] duration-200 ease-out before:absolute before:inset-x-0 before:top-0 before:h-1 hover:-translate-y-0.5 hover:shadow-md ${estilo.cartao}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-muted-foreground">{titulo}</p>
        <span aria-hidden className={`flex size-10 items-center justify-center rounded-lg shadow-sm ${estilo.icone}`}>
          <Icone className="size-5" />
        </span>
      </div>
      <p className={`text-3xl font-bold ${estilo.valor}`}>{valor}</p>
      <p className="text-sm text-muted-foreground">{detalhe}</p>
    </div>
  );
}
