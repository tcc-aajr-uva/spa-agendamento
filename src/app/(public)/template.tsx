import type { ReactNode } from "react";

export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-in duration-300 ease-out fade-in">{children}</div>;
}
