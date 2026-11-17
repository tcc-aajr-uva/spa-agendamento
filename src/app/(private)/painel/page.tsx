import { Suspense } from "react";
import { CalendarCheck, HeartHandshake, Hourglass, ListOrdered } from "lucide-react";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import type { Parametros } from "@/lib/painel/filtros-ocupacao";
import { listarEsperaPorEquipe } from "@/lib/painel/lista-espera";
import { listarPendentesPertoDeVencer } from "@/lib/painel/pendentes";
import { obterResumoDoPainel } from "@/lib/painel/resumo";
import { perfisDaRota } from "../menu";
import { PaginaModulo } from "../pagina-modulo";
import { CartaoResumo } from "./cartao-resumo";
import { ListaEsperaPorEquipe } from "./lista-espera-por-equipe";
import { ListaPendentes } from "./lista-pendentes";
import { Ocupacao } from "./ocupacao";
import { IndicadorCarregando } from "@/components/indicador-carregando";

export default function PaginaPainel({ searchParams }: { searchParams: Promise<Parametros> }) {
  return (
    <PaginaModulo titulo="Painel">
      <ConteudoDoPainel parametros={searchParams} />
    </PaginaModulo>
  );
}

async function ConteudoDoPainel({ parametros }: { parametros: Promise<Parametros> }) {
  const usuario = await exigirUsuario(perfisDaRota("/painel"));
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
          icone={Hourglass}
          tom="atencao"
        />
        <CartaoResumo
          titulo="Confirmados"
          valor={resumo.confirmados}
          detalhe="aguardando a 1ª sessão"
          icone={CalendarCheck}
          tom="primario"
        />
        <CartaoResumo
          titulo="Em atendimento"
          valor={resumo.emAtendimento}
          detalhe="sessões semanais"
          icone={HeartHandshake}
          tom="sucesso"
        />
        <CartaoResumo
          titulo="Na lista de espera"
          valor={resumo.naListaDeEspera}
          detalhe="aguardando chamada"
          icone={ListOrdered}
          tom="espera"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListaPendentes pendentes={pendentes} podeLiberar={usuario.perfil !== "SUPERVISOR"} />
        </div>
        <ListaEsperaPorEquipe linhas={espera} />
      </div>

      <Suspense fallback={<IndicadorCarregando texto="Carregando ocupação…" />}>
        <Ocupacao usuario={usuario} agora={agora} parametros={parametros} />
      </Suspense>
    </div>
  );
}