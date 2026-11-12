import type { Perfil } from "@/generated/prisma/client";

export function erroDeFormatoDosVinculos(
  perfil: Perfil, unidadeIds: string[], equipeIds: string[], exigeUnidade = true,
): { campo: "unidadeIds" | "equipeIds"; mensagem: string } | null {
  if (perfil === "ADMINISTRADOR") {
    return unidadeIds.length || equipeIds.length
      ? { campo: "unidadeIds", mensagem: "O administrador não possui unidades nem equipes." } : null;
  }
  if (exigeUnidade && unidadeIds.length === 0) {
    return { campo: "unidadeIds", mensagem: "Selecione ao menos uma unidade." };
  }
  if (perfil === "ESTAGIARIO" && unidadeIds.length > 1) {
    return { campo: "unidadeIds", mensagem: "O estagiário deve pertencer a exatamente uma unidade." };
  }
  if ((perfil === "COORDENACAO" || perfil === "SECRETARIA") && equipeIds.length > 0) {
    return { campo: "equipeIds", mensagem: "Este perfil possui apenas vínculos com unidades." };
  }
  return null;
}
