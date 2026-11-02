import { Skeleton } from "@/components/ui/skeleton";

const LINHAS = ["um", "dois", "tres", "quatro", "cinco"];

export function CarregandoLista() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      {LINHAS.map((linha) => (
        <Skeleton key={linha} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
