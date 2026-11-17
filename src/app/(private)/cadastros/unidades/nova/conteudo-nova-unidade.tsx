import { exigirUsuario } from "@/lib/auth/autorizacao";
import { criarUnidade } from "../actions";
import { FormularioUnidade } from "../formulario-unidade";
import { VALORES_PADRAO_UNIDADE } from "../formulario-unidade-schema";

export async function ConteudoNovaUnidade() {
  await exigirUsuario(["ADMINISTRADOR"]);
  return <FormularioUnidade acao={criarUnidade} rotuloBotao="Criar unidade" valores={VALORES_PADRAO_UNIDADE} />;
}
