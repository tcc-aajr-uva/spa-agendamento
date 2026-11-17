import { CarregandoLista } from "../../../carregando-lista";
import { PaginaModulo } from "../../../pagina-modulo";
import { ConteudoChamar } from "./conteudo-chamar";

type Parametros = PageProps<"/lista-espera/[id]/chamar">["params"];

export default function ChamarPage({ params }: PageProps<"/lista-espera/[id]/chamar">) {
  return (
    <PaginaModulo carregando={<CarregandoLista />}>
      <Chamar parametros={params} />
    </PaginaModulo>
  );
}

async function Chamar({ parametros }: { parametros: Parametros }) {
  const { id } = await parametros;
  return <ConteudoChamar id={id} />;
}
