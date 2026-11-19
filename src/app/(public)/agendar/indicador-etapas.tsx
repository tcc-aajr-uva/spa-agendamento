import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "cn";
import { ETAPAS, linkDaEtapa, type Selecao } from "./etapas";

type Props = { atual: number; selecao: Selecao };

const TRANSICAO = "transition-colors duration-200 ease-out";

export function IndicadorEtapas({ atual, selecao }: Props) {
  return (
    <nav aria-label="Etapas do agendamento">
      <ol className="flex items-start">
        {ETAPAS.map((etapa, indice) => {
          const concluida = indice < atual;
          const ativa = indice === atual;
          const conteudo = (
            <>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  TRANSICAO,
                  concluida && "border-primary bg-primary text-primary-foreground group-hover/etapa:bg-primary/80",
                  ativa && "border-secondary bg-secondary text-secondary-foreground",
                  !concluida && !ativa && "border-border bg-muted text-muted-foreground",
                )}
              >
                {concluida ? <Check aria-hidden className="size-4" /> : indice + 1}
              </span>
              <span className={cn("text-center text-xs font-medium", !concluida && !ativa && "text-muted-foreground")}>
                {etapa.rotulo}
              </span>
            </>
          );

          return (
            <li key={etapa.rotulo} className="relative flex flex-1 flex-col items-center">
              {indice > 0 && (
                <span
                  aria-hidden
                  className={cn("absolute top-[17px] -left-1/2 h-0.5 w-full", TRANSICAO, concluida || ativa ? "bg-primary" : "bg-border")}
                />
              )}
              {concluida ? (
                <Link
                  href={linkDaEtapa(indice, selecao)}
                  className="group/etapa relative z-10 flex flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {conteudo}
                </Link>
              ) : (
                <div aria-current={ativa ? "step" : undefined} className="relative z-10 flex flex-col items-center gap-1.5">
                  {conteudo}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
