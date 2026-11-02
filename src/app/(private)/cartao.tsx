import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-semibold">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

export function EstadoVazio({ children }: { children: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="text-muted-foreground">{children}</CardContent>
    </Card>
  );
}
