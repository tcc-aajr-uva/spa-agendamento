import { exigirUsuario } from "@/lib/auth/autorizacao";
import { listarUnidadesParaEquipe, listarSupervisoresParaEquipe } from "@/lib/equipe/consultar-equipe";
import { PERFIS_GESTAO_EQUIPES } from "@/lib/equipe/escopo-equipe";
import { criarEquipe } from "../actions";
import { FormularioEquipe } from "../formulario-equipe";

export async function ConteudoNovaEquipe() {
  const autor = await exigirUsuario([...PERFIS_GESTAO_EQUIPES]);
  const [unidades, supervisores] = await Promise.all([
    listarUnidadesParaEquipe(autor), listarSupervisoresParaEquipe(autor),
  ]);
  if (unidades.length === 0) return <p>Nenhuma unidade ativa disponível no seu escopo para cadastrar uma equipe.</p>;
  return <FormularioEquipe acao={criarEquipe} unidades={unidades} supervisores={supervisores} />;
}
