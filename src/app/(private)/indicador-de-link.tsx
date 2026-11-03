"use client";

import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";
import { cn } from "cn";

export function IndicadorDeLink({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();

  return <span className={cn("inline-flex items-center gap-1.5 transition-opacity duration-200 ease-out", pending && "opacity-50")}>{children}</span>;
}
