import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listarHorariosLivres } from "@/lib/agendamento/horarios-livres";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { PERFIS_QUE_CHAMAM } from "@/lib/lista-espera/inscricao";
import { prisma } from "@/lib/prisma";
import { CampoSelect } from "../../../campo-select";
import { CarregandoLista } from "../../../carregando-lista";
import { Cartao } from "../../../cartao";
import { formatarData } from "../../../formatar";
import { FormularioAcao } from "../../../formulario-acao";
import { LinkVoltar } from "../../../link-voltar";
import { PaginaModulo } from "../../../pagina-modulo";
import { chamar } from "../../actions";

type Parametros = PageProps<"/lista-espera/[id]/chamar">["params"];

export default function ChamarPage({ params }: PageProps<"/lista-espera/[id]/chamar">) {
  return (
    <PaginaModulo carregando={<CarregandoLista />}>
      <Chamar parametros={params} />
    </PaginaModulo>
  );
}

async function Chamar({ parametros }: { parametros: Parametros }) {
  const usuario = await exigirUsuario(PERFIS_QUE_CHAMAM);
  const { id } = await parametros;
  const inscricao = await prisma.listaEspera.findUnique({
    where: { id },
    select: {
      id: true,
      unidadeId: true,
      equipeId: true,
      status: true,
      inscritoEm: true,
      equipe: { select: { nome: true, unidade: { select: { nome: true } } } },
      paciente: { select: { nome: true, telefone: true, email: true, dataNascimento: true, responsavelNome: true } },
    },
  });
  if (!inscricao || !podeAcessar(usuario, inscricao)) notFound();

  const voltar = <LinkVoltar href={`/lista-espera?equipe=${inscricao.equipeId}`}>Voltar para a lista de espera</LinkVoltar>;
  if (inscricao.status !== "AGUARDANDO") {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        {voltar}
        <Alert variant="warning">
          <AlertDescription>Esta inscrição não está mais aguardando.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const horarios = await listarHorariosLivres(inscricao.unidadeId, inscricao.equipeId, {
    estagiarioId: usuario.perfil === "ESTAGIARIO" ? usuario.id : undefined,
  });
  const { paciente } = inscricao;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {voltar}
      <h1 className="text-2xl font-bold">Chamar da lista de espera</h1>
      <Cartao titulo={paciente.nome}>
        <p className="text-muted-foreground">
          {paciente.telefone} — {paciente.email} — nascimento {formatarData(paciente.dataNascimento)}
        </p>
        {paciente.responsavelNome && <p className="text-muted-foreground">Responsável: {paciente.responsavelNome}</p>}
        <p className="text-muted-foreground">
          {inscricao.equipe.unidade.nome} / {inscricao.equipe.nome} — na lista desde {formatarData(inscricao.inscritoEm)}
        </p>
      </Cartao>
      {horarios.length === 0 ? (
        <Alert variant="warning">
          <AlertDescription>Nenhum horário livre {usuario.perfil === "ESTAGIARIO" ? "na sua agenda" : "nesta equipe"}. O paciente continua na lista.</AlertDescription>
        </Alert>
      ) : (
        <Cartao titulo="Agendar">
          <FormularioAcao acao={chamar.bind(null, inscricao.id)} rotulo="Agendar com este horário" larguraTotal>
            <CampoSelect
              id="chamar-horario"
              nome="horario"
              rotulo="Horário combinado com o paciente"
              opcoes={horarios.map((horario) => ({
                value: `${horario.diaSemana}:${horario.horaInicio}`,
                label: `${DIAS_DA_SEMANA[horario.diaSemana]} às ${formatarHora(horario.horaInicio)}`,
              }))}
              obrigatorio
            />
          </FormularioAcao>
        </Cartao>
      )}
    </div>
  );
}
