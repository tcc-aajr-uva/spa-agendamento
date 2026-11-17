import { exigirUsuario } from "@/lib/auth/autorizacao";
import { perfisCriadosPor } from "@/lib/usuario/hierarquia";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { perfisDaRota } from "../../../menu";
import { criarUsuario } from "../actions";
import { FormularioUsuario } from "../formulario-usuario";

export async function ConteudoNovoUsuario() {
  const autor = await exigirUsuario(perfisDaRota("/cadastros"));
  const perfis = perfisCriadosPor(autor.perfil);
  if (perfis.length === 0) return null;

  const configuracoes = await Promise.all(
    perfis.map(async (perfil) => ({
      perfil,
      ...await listarOpcoesDeVinculo(autor, perfil),
    })),
  );

  return <FormularioUsuario acao={criarUsuario} configuracoes={configuracoes} exigeEquipe={autor.perfil === "SUPERVISOR"} />;
}
