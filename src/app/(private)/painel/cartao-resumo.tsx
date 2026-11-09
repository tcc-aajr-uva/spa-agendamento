type Props = {
  titulo: string;
  valor: number;
  detalhe: string;
  destaque?: boolean;
};

export function CartaoResumo({ titulo, valor, detalhe, destaque = false }: Props) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-6 shadow-sm ${
        destaque ? "border-secondary bg-warning-soft" : "bg-card"
      }`}
    >
      <p className="text-muted-foreground">{titulo}</p>
      <p className="text-3xl font-bold">{valor}</p>
      <p className="text-sm text-muted-foreground">{detalhe}</p>
    </div>
  );
}