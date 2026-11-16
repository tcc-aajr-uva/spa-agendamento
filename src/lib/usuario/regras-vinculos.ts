import type { Perfil } from "@/generated/prisma/client";

export const ERRO_REMOCAO_ULTIMA_UNIDADE_ATIVA = "Não é possível remover a última unidade ativa. Vincule outra unidade ativa antes de salvar.";

export type RegrasEdicaoUnidades = {
  unidadeIdsOriginais: readonly string[];
  unidades: readonly { id: string; disponivel: boolean }[];
  possuiUnidadeAtivaForaDoEscopo?: boolean;
};

export function erroDeRemocaoDaUltimaUnidadeAtiva(unidadeIds: readonly string[], regras: RegrasEdicaoUnidades): string | null {
  if (regras.possuiUnidadeAtivaForaDoEscopo) return null;
  const retirouAtiva = regras.unidades.some((unidade) => unidade.disponivel &&
    regras.unidadeIdsOriginais.includes(unidade.id) && !unidadeIds.includes(unidade.id));
  const manteveAtiva = regras.unidades.some((unidade) => unidade.disponivel && unidadeIds.includes(unidade.id));
  return retirouAtiva && !manteveAtiva ? ERRO_REMOCAO_ULTIMA_UNIDADE_ATIVA : null;
}

export function erroDeUnidadeDasEquipes(
  unidadeIds: readonly string[], equipeIds: readonly string[], equipes: readonly { id: string; unidadeId: string }[],
): string | null {
  return equipeIds.some((id) => !equipes.some((equipe) => equipe.id === id && unidadeIds.includes(equipe.unidadeId)))
    ? "Remova os vínculos com as equipes desta unidade antes de salvar."
    : null;
}

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
