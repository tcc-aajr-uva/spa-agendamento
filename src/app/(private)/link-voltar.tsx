import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LinkVoltar({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button variant="ghost" size="sm" nativeButton={false} className="self-start" render={<Link href={href} />}>
      <ChevronLeftIcon data-icon="inline-start" />
      {children}
    </Button>
  );
}
