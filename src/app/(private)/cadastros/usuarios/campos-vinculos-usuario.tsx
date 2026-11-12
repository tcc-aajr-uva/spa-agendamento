"use client";

import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import type { PerfilCriavel } from "@/lib/usuario/hierarquia";
import { CampoVinculosUsuario, type OpcaoVinculoUsuario } from "./campo-vinculos-usuario";

export type OpcoesVinculosUsuario = {
  perfil: PerfilCriavel;
  unidades: OpcaoVinculoUsuario[];
  equipes: OpcaoVinculoUsuario[];
  unidadesFixas?: boolean;
  exigeEquipe?: boolean;
};

export function CamposVinculosUsuario({ perfil, unidades, equipes, unidadeIds, equipeIds, unidadesFixas = false,
  exigeEquipe = false, bloqueado, erros, aoAlterar }: OpcoesVinculosUsuario & {
  unidadeIds: string[];
  equipeIds: string[];
  bloqueado: boolean;
  erros: { unidadeIds?: string; equipeIds?: string };
  aoAlterar: (campo: "unidadeIds" | "equipeIds", ids: string[]) => void;
}) {
  const possuiEquipes = perfil === "SUPERVISOR" || perfil === "ESTAGIARIO";
  const equipesDisponiveis = equipes.filter(({ unidadeId }) => unidadeIds.includes(unidadeId));
  return (
    <div className={possuiEquipes ? "grid gap-8 md:grid-cols-2" : "grid gap-8"}>
      <FieldSet className="min-w-0">
        <FieldLegend className="text-base font-semibold">{perfil === "ESTAGIARIO" ? "Unidade" : "Unidades"}</FieldLegend>
        <CampoVinculosUsuario opcoes={unidades} tipo="unidadeIds" vinculos={unidadeIds} mesmaUnidade={false}
          maximo={perfil === "ESTAGIARIO" ? 1 : undefined} bloqueado={bloqueado || unidadesFixas}
          erro={erros.unidadeIds} aoAlterar={(ids) => {
            aoAlterar("unidadeIds", ids);
            const mantidas = equipeIds.filter((id) => equipes.some((equipe) => equipe.id === id && ids.includes(equipe.unidadeId)));
            if (mantidas.length !== equipeIds.length) aoAlterar("equipeIds", mantidas);
          }} />
        {unidades.length === 0 && <FieldDescription>Não há unidades disponíveis no seu escopo.</FieldDescription>}
      </FieldSet>
      {possuiEquipes && (
        <FieldSet className="min-w-0">
          <FieldLegend className="text-base font-semibold">{exigeEquipe ? "Equipes" : "Equipes (opcional)"}</FieldLegend>
          <CampoVinculosUsuario opcoes={equipesDisponiveis} tipo="equipeIds" vinculos={equipeIds}
            mesmaUnidade={perfil === "ESTAGIARIO"} bloqueado={bloqueado} erro={erros.equipeIds}
            mensagemVazia={unidadeIds.length === 0 ? "Selecione uma unidade para consultar as equipes." : "Nenhuma equipe disponível para adicionar nesta unidade."}
            aoAlterar={(ids) => aoAlterar("equipeIds", ids)} />
        </FieldSet>
      )}
    </div>
  );
}
