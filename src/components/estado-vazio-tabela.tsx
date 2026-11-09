import { TableCell, TableRow } from "@/components/ui/table";

type Props = {
  colunas: number;
  titulo: string;
  descricao: string;
};

export function EstadoVazioTabela({ colunas, titulo, descricao }: Props) {
  return (
    <TableRow>
      <TableCell colSpan={colunas} className="h-32 whitespace-normal text-center">
        <div className="space-y-1">
          <p className="font-medium">{titulo}</p>
          <p className="text-muted-foreground">{descricao}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
