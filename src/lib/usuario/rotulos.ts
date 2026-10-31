import type { Perfil } from "@/generated/prisma/client";

const ROTULOS_PERFIL: Record<Perfil, string> = {
  ADMINISTRADOR: "Administrador",
  COORDENACAO: "Coordenação",
  SECRETARIA: "Secretaria",
  SUPERVISOR: "Supervisor",
  ESTAGIARIO: "Estagiário",
};

export function rotuloDoPerfil(perfil: Perfil): string {
  return ROTULOS_PERFIL[perfil];
}
