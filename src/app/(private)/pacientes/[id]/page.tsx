import { CarregandoLista } from "../../carregando-lista";
import { LinkVoltar } from "../../link-voltar";
import { PaginaModulo } from "../../pagina-modulo";
import { DetalhePaciente } from "./detalhe-paciente";

type Parametros = PageProps<"/pacientes/[id]">["params"];

export default function AtendimentoPage({ params }: PageProps<"/pacientes/[id]">) {
  return (
    <PaginaModulo carregando={<CarregandoLista />}>
      <Atendimento parametros={params} />
    </PaginaModulo>
  );
}

async function Atendimento({ parametros }: { parametros: Parametros }) {
  const { id } = await parametros;
  return (
    <div className="flex flex-col gap-4">
      <LinkVoltar href="/pacientes">Voltar para pacientes</LinkVoltar>
      <DetalhePaciente id={id} paginaCheia />
    </div>
  );
}
