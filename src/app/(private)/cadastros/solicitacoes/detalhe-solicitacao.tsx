import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarSolicitacao } from "@/lib/solicitacao-acesso/consultar-solicitacao";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { perfisDaRota } from "../../menu";
import { aprovarSolicitacao, recusarSolicitacao } from "./actions";
import { FormularioAprovacao } from "./formulario-aprovacao";
import { FormularioRecusa } from "./formulario-recusa";

type Props = {
  id: string;
  secao: "aprovar" | "recusar";
};

export async function DetalheSolicitacao({ id, secao }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros/solicitacoes"));
  const solicitacao = await consultarSolicitacao(id, autor);
  if (!solicitacao) return <p className="text-muted-foreground">Solicitação não encontrada.</p>;

  const pendente = solicitacao.status === "PENDENTE";

  if (secao === "recusar") {
    return (
      <FormularioRecusa
        key={solicitacao.id}
        acao={recusarSolicitacao.bind(null, solicitacao.id)}
        solicitacao={{ nome: solicitacao.nome, email: solicitacao.email, unidade: solicitacao.unidade.nome }}
        pendente={pendente}
      />
    );
  }

  const { unidades, equipes } = await listarOpcoesDeVinculo(autor, "ESTAGIARIO");

  return (
    <FormularioAprovacao
      key={solicitacao.id}
      acao={aprovarSolicitacao.bind(null, solicitacao.id)}
      solicitacao={{ nome: solicitacao.nome, email: solicitacao.email, unidadeId: solicitacao.unidadeId }}
      pendente={pendente}
      unidades={unidades}
      equipes={equipes}
    />
  );
}
