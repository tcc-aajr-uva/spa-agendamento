import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPA UVA",
  description: "Sistema de agendamento do Serviço de Psicologia Aplicada da UVA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("h-full", "antialiased", manrope.variable, "font-sans", inter.variable)}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
