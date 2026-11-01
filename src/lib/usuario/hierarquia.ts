import type { Perfil } from "@/generated/prisma/client";

export type PerfilCriavel = Exclude<Perfil, "ADMINISTRADOR">;

const TODOS_OS_PERFIS: PerfilCriavel[] = ["COORDENACAO", "SECRETARIA", "SUPERVISOR", "ESTAGIARIO"];

const PERFIS_CRIADOS_POR: Record<Perfil, PerfilCriavel[]> = {
  ADMINISTRADOR: TODOS_OS_PERFIS,
  COORDENACAO: ["SECRETARIA", "SUPERVISOR", "ESTAGIARIO"],
  SECRETARIA: ["SUPERVISOR"],
  SUPERVISOR: ["ESTAGIARIO"],
  ESTAGIARIO: [],
};

export function perfisCriadosPor(perfil: Perfil): readonly PerfilCriavel[] {
  return PERFIS_CRIADOS_POR[perfil];
}
