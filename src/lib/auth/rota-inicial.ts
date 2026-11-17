import type { Perfil } from "@/generated/prisma/client";

export function rotaInicialDoPerfil(perfil: Perfil): string {
  return perfil === "ESTAGIARIO" ? "/agenda" : "/painel";
}
