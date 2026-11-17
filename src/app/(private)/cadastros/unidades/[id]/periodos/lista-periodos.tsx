import { PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataPeriodo, ROTULOS_SITUACAO_PERIODO, type SituacaoPeriodo } from "@/lib/periodo-letivo/dados-periodo";
import { BotaoEdicao } from "../../../../modal-edicao";

type Props = {
  periodos: { id: string; inicio: string; fim: string; situacao: SituacaoPeriodo }[];
  hrefDoPeriodo: (periodoId: string) => string;
};

export function ListaPeriodos({ periodos, hrefDoPeriodo }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table aria-label="Períodos letivos" className="min-w-100">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead scope="col" className="px-4">Início</TableHead>
            <TableHead scope="col">Fim</TableHead>
            <TableHead scope="col">Situação</TableHead>
            <TableHead scope="col" className="w-16 px-4">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periodos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 whitespace-normal text-center">
                <div className="space-y-1">
                  <p className="font-medium">Nenhum período letivo encontrado.</p>
                  <p className="text-muted-foreground">Altere ou limpe o filtro de situação para tentar novamente.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : periodos.map((periodo) => (
            <TableRow key={periodo.id}>
              <TableHead scope="row" className="px-4 py-4 font-medium">
                {formatarDataPeriodo(periodo.inicio)}
              </TableHead>
              <TableCell>{formatarDataPeriodo(periodo.fim)}</TableCell>
              <TableCell>
                <Badge variant={periodo.situacao === "EM_ANDAMENTO" ? "default" : periodo.situacao === "FUTURO" ? "accent" : "outline"}>
                  {ROTULOS_SITUACAO_PERIODO[periodo.situacao]}
                </Badge>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex justify-center">
                  <BotaoEdicao
                    parametro="periodo"
                    tom="editar"
                    href={hrefDoPeriodo(periodo.id)}
                    rotulo={`Editar período de ${formatarDataPeriodo(periodo.inicio)} a ${formatarDataPeriodo(periodo.fim)}`}
                  >
                    <PencilIcon />
                  </BotaoEdicao>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
