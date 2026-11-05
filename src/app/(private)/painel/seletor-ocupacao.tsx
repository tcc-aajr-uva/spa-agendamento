import Link from "next/link";

import { DIAS_DA_SEMANA } from "@/lib/agendamento/regras";

const DIAS_DO_SELETOR = [1, 2, 3, 4, 5, 6];

function endereco(unidadeId: string, dia: number): string {
  return `/painel?${new URLSearchParams({ unidade: unidadeId, dia: String(dia) })}`;
}

function Segmento({ ativo, href, children }: { ativo: boolean; href: string; children: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={ativo ? "page" : undefined}
      className={`rounded-md px-3 py-1.5 text-sm ${ativo ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
    >
      {children}
    </Link>
  );
}

type Props = {
  unidades: { id: string; nome: string }[];
  unidadeId: string;
  diaSemana: number;
};

export function SeletorOcupacao({ unidades, unidadeId, diaSemana }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {unidades.length > 1 ? (
        <nav aria-label="Unidade" className="inline-flex gap-1 rounded-lg bg-muted p-1">
          {unidades.map((unidade) => (
            <Segmento key={unidade.id} ativo={unidade.id === unidadeId} href={endereco(unidade.id, diaSemana)}>
              {unidade.nome}
            </Segmento>
          ))}
        </nav>
      ) : (
        <span />
      )}
      <nav aria-label="Dia da semana" className="inline-flex gap-1 rounded-lg bg-muted p-1">
        {DIAS_DO_SELETOR.map((dia) => (
          <Segmento key={dia} ativo={dia === diaSemana} href={endereco(unidadeId, dia)}>
            {DIAS_DA_SEMANA[dia].slice(0, 3)}
          </Segmento>
        ))}
      </nav>
    </div>
  );
}