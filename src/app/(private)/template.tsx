import type { ReactNode } from "react";

export default function PrivateTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-in duration-300 ease-out fade-in slide-in-from-bottom-1">{children}</div>;
}
