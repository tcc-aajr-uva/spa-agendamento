import Link from "next/link";
import { CalendarPlus, CalendarX, LogIn, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ETAPAS } from "./agendar/etapas";

const PASSOS = [
  ...ETAPAS,
  { rotulo: "Confirmação", descricao: "O estagiário liga em até 48 h para confirmar o atendimento.", icone: PhoneCall },
];

const TONS = [
  { cartao: "from-primary/12 border-primary/30 before:bg-primary", icone: "bg-primary/15 text-primary", numero: "text-primary" },
  { cartao: "from-espera/12 border-espera/30 before:bg-espera", icone: "bg-espera/15 text-espera", numero: "text-espera" },
  {
    cartao: "from-secondary/25 border-secondary/60 before:bg-secondary",
    icone: "bg-secondary text-secondary-foreground",
    numero: "text-atencao",
  },
  { cartao: "from-realce/12 border-realce/30 before:bg-realce", icone: "bg-realce/15 text-realce", numero: "text-realce" },
  { cartao: "from-sucesso/12 border-sucesso/30 before:bg-sucesso", icone: "bg-sucesso/15 text-sucesso", numero: "text-sucesso" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-destaque-2 text-2xl font-bold text-primary-foreground shadow-md shadow-primary/30">
          S
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-2xl font-bold tracking-tight sm:text-3xl">SPA UVA</span>
          <span className="text-sm text-muted-foreground">Serviço de Psicologia Aplicada</span>
        </span>
      </header>

      <section className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Agende seu atendimento psicológico</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            O Serviço de Psicologia Aplicada da Universidade Veiga de Almeida oferece atendimento com estagiários supervisionados.
            Escolha a unidade, o tipo de atendimento e o horário que funciona para você.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-12 gap-2 px-5 text-base" nativeButton={false} render={<Link href="/agendar" />}>
            <CalendarPlus className="size-5" />
            Quero agendar um atendimento
          </Button>
          <Button size="lg" variant="outline" className="h-12 gap-2 px-5 text-base" nativeButton={false} render={<Link href="/cancelar" />}>
            <CalendarX className="size-5" />
            Cancelar agendamento
          </Button>
          <Button size="lg" variant="outline" className="h-12 gap-2 px-5 text-base" nativeButton={false} render={<Link href="/entrar" />}>
            <LogIn className="size-5" />
            Área interna
          </Button>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-5">
        <h2 id="como-funciona" className="text-xl font-semibold">
          Como funciona
        </h2>
        <ol className="grid gap-3 md:grid-cols-5">
          {PASSOS.map((passo, indice) => {
            const tom = TONS[indice % TONS.length];
            return (
              <li
                key={passo.rotulo}
                className={`relative flex gap-3 overflow-hidden rounded-xl border bg-card bg-linear-to-br to-card to-70% p-4 pt-5 text-card-foreground shadow-sm transition-[translate,box-shadow] duration-200 ease-out before:absolute before:inset-x-0 before:top-0 before:h-1 hover:-translate-y-0.5 hover:shadow-md md:flex-col ${tom.cartao}`}
              >
                <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${tom.icone}`}>
                  <passo.icone className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">
                    <span className={`font-bold ${tom.numero}`}>{indice + 1}.</span> {passo.rotulo}
                  </p>
                  <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
