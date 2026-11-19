import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listarOpcoesDeHorario, type OpcaoDeHorario } from "@/lib/agendamento/opcoes-de-horario";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { PERFIS_QUE_AGENDAM } from "@/lib/lista-espera/inscricao";
import { prisma } from "@/lib/prisma";
import { Cartao } from "../../../cartao";
import { formatarData } from "../../../formatar";
import { FormularioAcao } from "../../../formulario-acao";
import { LinkVoltar } from "../../../link-voltar";
import { SeletorHorarioSala } from "../../../seletor-horario-sala";
import { agendar } from "../../actions";

type DadosAgendar = {
  inscricaoId: string;
  inscritoEm: Date;
  equipe: string;
  paciente: { nome: string; telefone: string; email: string; dataNascimento: Date; responsavelNome: string | null };
  opcoes: OpcaoDeHorario[];
};

export function PainelAgendar({ inscricaoId, inscritoEm, equipe, paciente, opcoes }: DadosAgendar) {
  return (
    <div className="flex flex-col gap-4">
      <Cartao titulo={paciente.nome}>
        <p className="text-muted-foreground">
          {paciente.telefone} — {paciente.email} — nascimento {formatarData(paciente.dataNascimento)}
        </p>
        {paciente.responsavelNome && <p className="text-muted-foreground">Responsável: {paciente.responsavelNome}</p>}
        <p className="text-muted-foreground">
          {equipe} — na lista desde {formatarData(inscritoEm)}
        </p>
      </Cartao>
      {opcoes.length === 0 ? (
        <Alert variant="warning">
          <AlertDescription>Nenhum horário com sala disponível e livre. O paciente continua na sua lista.</AlertDescription>
        </Alert>
      ) : (
        <Cartao titulo="Horário combinado com o paciente">
          <FormularioAcao acao={agendar.bind(null, inscricaoId)} rotulo="Agendar" larguraTotal>
            <SeletorHorarioSala idBase={`agendar-${inscricaoId}`} opcoes={opcoes} />
          </FormularioAcao>
        </Cartao>
      )}
    </div>
  );
}

export async function ConteudoChamar({ id }: { id: string }) {
  const usuario = await exigirUsuario(PERFIS_QUE_AGENDAM);
  const inscricao = await prisma.listaEspera.findUnique({
    where: { id },
    select: {
      id: true,
      unidadeId: true,
      equipeId: true,
      estagiarioId: true,
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

  const opcoes = await listarOpcoesDeHorario({ unidadeId: inscricao.unidadeId, estagiarioId: inscricao.estagiarioId });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {voltar}
      <h1 className="text-2xl font-bold">Agendar paciente da lista</h1>
      <PainelAgendar
        inscricaoId={inscricao.id}
        inscritoEm={inscricao.inscritoEm}
        equipe={`${inscricao.equipe.unidade.nome} / ${inscricao.equipe.nome}`}
        paciente={inscricao.paciente}
        opcoes={opcoes}
      />
    </div>
  );
}
