import { cn } from "cn";

const ONDAS = [
  "M-120 640 C 200 530, 430 780, 730 650 S 1250 520, 1560 610",
  "M-120 720 C 240 620, 470 840, 770 730 S 1270 610, 1560 700",
  "M-120 800 C 280 720, 520 900, 820 800 S 1290 700, 1560 780",
  "M-120 250 C 260 160, 530 360, 830 250 S 1310 130, 1560 210",
];

const ANEIS = [
  { cx: 1190, cy: 170, raios: [110, 170, 230] },
  { cx: 210, cy: 760, raios: [80, 140] },
];

type Props = { variante?: "suave" | "destaque" };

export function FundoAbstrato({ variante = "suave" }: Props) {
  const destaque = variante === "destaque";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        destaque && "bg-linear-to-br from-destaque to-destaque-2",
      )}
    >
      <div
        className={cn(
          "absolute -top-32 -left-24 size-[28rem] animate-flutuar rounded-full blur-3xl",
          destaque ? "bg-destaque-foreground/10" : "bg-primary/10",
        )}
      />
      <div
        className={cn(
          "absolute -right-24 -bottom-40 size-[32rem] animate-flutuar rounded-full blur-3xl [animation-delay:-11s]",
          destaque ? "bg-secondary/20" : "bg-secondary/15",
        )}
      />
      <svg
        className={cn("absolute inset-0 size-full", destaque ? "text-destaque-foreground/20" : "text-primary/15")}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern id="fundo-pontos" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect x="980" y="520" width="380" height="300" fill="url(#fundo-pontos)" opacity="0.5" />
        <rect x="80" y="80" width="300" height="220" fill="url(#fundo-pontos)" opacity="0.4" />
        <g className="animate-deslizar" stroke="currentColor" strokeWidth="1.5">
          {ONDAS.map((onda) => (
            <path key={onda} d={onda} />
          ))}
        </g>
        <g stroke="currentColor" strokeWidth="1.2">
          {ANEIS.flatMap(({ cx, cy, raios }) => raios.map((r) => <circle key={`${cx}-${r}`} cx={cx} cy={cy} r={r} />))}
        </g>
      </svg>
    </div>
  );
}
