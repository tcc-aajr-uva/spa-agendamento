import { exigirUsuario } from "@/lib/auth/permissao";
import { PaginaModulo } from "../pagina-modulo";

export default function InicioPage() {
  return (
    <PaginaModulo titulo="Início" card="esqueleto" pendente="cada card substitui as telas cruas pelas definitivas.">
      <BoasVindas />
    </PaginaModulo>
  );
}

async function BoasVindas() {
  const usuario = await exigirUsuario();
  return (
    <p>
      Olá, {usuario.nome}. Perfil {usuario.perfil}. Use o menu acima.
    </p>
  );
}
