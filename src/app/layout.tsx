import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { IndicadorDeNavegacao } from "@/components/indicador-de-navegacao";
import { MonitorDeRolagem } from "@/components/monitor-de-rolagem";
import { Toaster } from "@/components/ui/toast";

const APLICAR_TEMA = `try{var t=localStorage.getItem("tema");if(t==="escuro"||(t!=="claro"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPA UVA",
  description: "Sistema de agendamento do Serviço de Psicologia Aplicada da UVA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans", inter.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
      </head>
      <body className="min-h-full font-sans transition-colors duration-300 ease-out">
        <IndicadorDeNavegacao />
        <MonitorDeRolagem />
        <div data-conteudo>{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
