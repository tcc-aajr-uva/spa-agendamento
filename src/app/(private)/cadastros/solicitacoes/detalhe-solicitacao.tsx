import { exigirUsuario } from "@/lib/auth/autorizacao";
import { consultarSolicitacao } from "@/lib/solicitacao-acesso/consultar-solicitacao";
import { listarOpcoesDeVinculo } from "@/lib/usuario/opcoes-vinculo";
import { perfisDaRota } from "../../menu";
import { aprovarSolicitacao } from "./actions";
import { FormularioAprovacao } from "./formulario-aprovacao";

type Props = {
  id: string;
};

export async function DetalheSolicitacao({ id }: Props) {
  const autor = await exigirUsuario(perfisDaRota("/cadastros/solicitacoes"));
  const solicitacao = await consultarSolicitacao(id, autor);
  if (!solicitacao) return <p className="text-muted-foreground">Solicitação não encontrada.</p>;

  const { unidades, equipes } = await listarOpcoesDeVinculo(autor, "ESTAGIARIO");

  return (
    <FormularioAprovacao
      key={solicitacao.id}
      acao={aprovarSolicitacao.bind(null, solicitacao.id)}
      solicitacao={{ nome: solicitacao.nome, email: solicitacao.email, unidadeId: solicitacao.unidadeId }}
      pendente={solicitacao.status === "PENDENTE"}
      unidades={unidades}
      equipes={equipes}
    />
  );
}
