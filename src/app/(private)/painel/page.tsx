import { exigirUsuario } from "@/lib/auth/autorizacao";
import { obterResumoDoPainel } from "@/lib/painel/resumo";
import { PaginaModulo } from "../pagina-modulo";
import { CartaoResumo } from "./cartao-resumo";
import { ListaPendentes } from "./lista-pendentes";
import { listarPendentesPertoDeVencer } from "@/lib/painel/pendentes";
import { listarEsperaPorEquipe } from "@/lib/painel/lista-espera";
import { ListaEsperaPorEquipe } from "./lista-espera-por-equipe";

export default function PaginaPainel() {
  return (
    <PaginaModulo titulo="Painel">
      <ConteudoDoPainel />
    </PaginaModulo>
  );
}

async function ConteudoDoPainel() {
  const usuario = await exigirUsuario(["SECRETARIA", "COORDENACAO", "ADMINISTRADOR"]);
  const agora = new Date();
  const [resumo, pendentes, espera] = await Promise.all([
    obterResumoDoPainel(usuario, agora),
    listarPendentesPertoDeVencer(usuario, agora),
    listarEsperaPorEquipe(usuario),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoResumo
        titulo="Pendentes"
        valor={resumo.pendentes}
        detalhe={`${resumo.pertoDeVencer} perto de vencer`}
        destaque
      />
      <CartaoResumo titulo="Confirmados" valor={resumo.confirmados} detalhe="aguardando a 1ª sessão" />
      <CartaoResumo titulo="Em atendimento" valor={resumo.emAtendimento} detalhe="sessões semanais" />
      <CartaoResumo titulo="Na lista de espera" valor={resumo.naListaDeEspera} detalhe="aguardando chamada" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListaPendentes pendentes={pendentes} />
        </div>
        <ListaEsperaPorEquipe linhas={espera} />
      </div>
    </div>
  );
}