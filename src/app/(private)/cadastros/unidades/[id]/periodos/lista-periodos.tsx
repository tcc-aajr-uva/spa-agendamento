import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataPeriodo, ROTULOS_SITUACAO_PERIODO, type SituacaoPeriodo } from "@/lib/periodo-letivo/dados-periodo";

type Props = {
  periodos: { id: string; inicio: string; fim: string; situacao: SituacaoPeriodo }[];
  caminhoDetalhes: string;
};

export function ListaPeriodos({ periodos, caminhoDetalhes }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table aria-label="Períodos letivos" className="min-w-100">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead scope="col" className="px-4">Início</TableHead>
            <TableHead scope="col">Fim</TableHead>
            <TableHead scope="col">Situação</TableHead>
            <TableHead scope="col" className="w-10 px-4" aria-label="Detalhes do período" />
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
            <TableRow key={periodo.id} className="relative">
              <TableHead scope="row" className="px-4 py-4">
                <Link className="font-medium underline-offset-4 hover:underline after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                  prefetch={false} href={`${caminhoDetalhes}/${periodo.id}`}
                  aria-label={`Ver período de ${formatarDataPeriodo(periodo.inicio)} a ${formatarDataPeriodo(periodo.fim)}`}>
                  {formatarDataPeriodo(periodo.inicio)}
                </Link>
              </TableHead>
              <TableCell>{formatarDataPeriodo(periodo.fim)}</TableCell>
              <TableCell>
                <Badge variant={periodo.situacao === "EM_ANDAMENTO" ? "default" : periodo.situacao === "FUTURO" ? "accent" : "outline"}>
                  {ROTULOS_SITUACAO_PERIODO[periodo.situacao]}
                </Badge>
              </TableCell>
              <TableCell className="px-4 text-right">
                <ChevronRightIcon aria-hidden="true" className="ml-auto size-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
