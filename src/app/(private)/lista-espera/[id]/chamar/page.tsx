import Link from "next/link";
import { notFound } from "next/navigation";
import { listarHorariosLivres } from "@/lib/agendamento/horarios-livres";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { PERFIS_QUE_CHAMAM } from "@/lib/lista-espera/inscricao";
import { prisma } from "@/lib/prisma";
import { formatarData } from "../../../formatar";
import { FormularioAcao } from "../../../formulario-acao";
import { PaginaModulo } from "../../../pagina-modulo";
import { chamar } from "../../actions";

type Parametros = PageProps<"/lista-espera/[id]/chamar">["params"];

export default function ChamarPage({ params }: PageProps<"/lista-espera/[id]/chamar">) {
  return (
    <PaginaModulo titulo="Chamar da lista de espera" card="#3" pendente="design definitivo, a combinar com o time.">
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

  const voltar = (
    <Link className="underline" href={`/lista-espera?equipe=${inscricao.equipeId}`}>
      Voltar para a lista de espera
    </Link>
  );
  if (inscricao.status !== "AGUARDANDO") {
    return (
      <div className="flex flex-col gap-3">
        <p>Esta inscrição não está mais aguardando ({inscricao.status}).</p>
        {voltar}
      </div>
    );
  }

  const horarios = await listarHorariosLivres(inscricao.unidadeId, inscricao.equipeId, {
    estagiarioId: usuario.perfil === "ESTAGIARIO" ? usuario.id : undefined,
  });
  const { paciente } = inscricao;

  return (
    <div className="flex flex-col gap-4">
      {voltar}
      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">{paciente.nome}</h2>
        <p>
          {paciente.telefone} — {paciente.email} — nascimento {formatarData(paciente.dataNascimento)}
        </p>
        {paciente.responsavelNome && <p>Responsável: {paciente.responsavelNome}</p>}
        <p>
          {inscricao.equipe.unidade.nome} / {inscricao.equipe.nome} — na lista desde {formatarData(inscricao.inscritoEm)}
        </p>
      </section>
      {horarios.length === 0 ? (
        <p>Nenhum horário livre {usuario.perfil === "ESTAGIARIO" ? "na sua agenda" : "nesta equipe"}. O paciente continua na lista.</p>
      ) : (
        <FormularioAcao acao={chamar.bind(null, inscricao.id)} rotulo="Agendar com este horário">
          <label className="flex flex-col gap-1 text-sm">
            Horário combinado com o paciente
            <select name="horario" required className="rounded border bg-transparent px-2 py-1">
              {horarios.map((horario) => (
                <option key={`${horario.diaSemana}:${horario.horaInicio}`} value={`${horario.diaSemana}:${horario.horaInicio}`}>
                  {DIAS_DA_SEMANA[horario.diaSemana]} às {formatarHora(horario.horaInicio)}
                </option>
              ))}
            </select>
          </label>
        </FormularioAcao>
      )}
    </div>
  );
}
