import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora } from "@/lib/agendamento/regras";
import { mascararCpf } from "@/lib/paciente/dados-paciente";
import { prisma } from "@/lib/prisma";
import { formatarData, formatarDataHora } from "../../formatar";
import { PaginaModulo } from "../../pagina-modulo";
import { perfisDaRota } from "../../menu";
import { AcoesConfirmacao } from "./acoes-confirmacao";

type Parametros = PageProps<"/pacientes/[id]">["params"];

export default function AtendimentoPage({ params }: PageProps<"/pacientes/[id]">) {
  return (
    <PaginaModulo titulo="Atendimento" card="#3" pendente="design definitivo, a combinar com o time.">
      <Atendimento parametros={params} />
    </PaginaModulo>
  );
}

async function Atendimento({ parametros }: { parametros: Parametros }) {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  const { id } = await parametros;
  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    select: {
      id: true,
      unidadeId: true,
      equipeId: true,
      estagiarioId: true,
      diaSemana: true,
      horaInicio: true,
      status: true,
      dataInicio: true,
      dataFim: true,
      prazoConfirmacao: true,
      confirmadoEm: true,
      termoAssinadoEm: true,
      motivoEncerramento: true,
      encerradoEm: true,
      horarioAtivoId: true,
      paciente: {
        select: { nome: true, cpf: true, dataNascimento: true, telefone: true, email: true, responsavelNome: true, responsavelCpf: true },
      },
      unidade: { select: { nome: true } },
      equipe: { select: { nome: true } },
      estagiario: { select: { nome: true } },
      sala: { select: { nome: true } },
      sessoes: {
        orderBy: { data: "desc" },
        take: 50,
        select: { id: true, data: true, presenca: true, registradoPor: { select: { nome: true } } },
      },
      eventos: {
        orderBy: { criadoEm: "desc" },
        take: 50,
        select: { id: true, tipo: true, observacao: true, criadoEm: true, usuario: { select: { nome: true } } },
      },
    },
  });
  if (!agendamento || !podeAcessar(usuario, agendamento)) notFound();

  const agora = new Date();
  const ativo = estaOcupando(agendamento, agora);
  const { paciente } = agendamento;

  return (
    <div className="flex flex-col gap-6">
      <Link className="underline" href="/pacientes">
        Voltar para pacientes
      </Link>

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">{paciente.nome}</h2>
        <p>
          CPF {mascararCpf(paciente.cpf)} — nascimento {formatarData(paciente.dataNascimento)}
        </p>
        <p>
          {paciente.telefone} — {paciente.email}
        </p>
        {paciente.responsavelNome && (
          <p>
            Responsável: {paciente.responsavelNome} (CPF {mascararCpf(paciente.responsavelCpf ?? "")})
          </p>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">Agendamento</h2>
        <p>
          {agendamento.unidade.nome} / {agendamento.equipe.nome} — {agendamento.estagiario.nome}
        </p>
        <p>
          {DIAS_DA_SEMANA[agendamento.diaSemana]} às {formatarHora(agendamento.horaInicio)} — {agendamento.sala.nome} — de{" "}
          {formatarData(agendamento.dataInicio)} a {formatarData(agendamento.dataFim)}
        </p>
        <p>
          Status: {agendamento.status}
          {agendamento.motivoEncerramento && ` (${agendamento.motivoEncerramento})`}
        </p>
        {agendamento.status === "PENDENTE" && <p>Confirmar até {formatarDataHora(agendamento.prazoConfirmacao)}</p>}
        {agendamento.status === "PENDENTE" && !ativo && <p>Prazo de confirmação vencido: o horário será liberado.</p>}
        {agendamento.confirmadoEm && <p>Confirmado em {formatarDataHora(agendamento.confirmadoEm)}</p>}
        <p>Termo de consentimento: {agendamento.termoAssinadoEm ? `assinado em ${formatarDataHora(agendamento.termoAssinadoEm)}` : "não assinado"}</p>
        {agendamento.encerradoEm && <p>Encerrado em {formatarDataHora(agendamento.encerradoEm)}</p>}
      </section>

      {ativo && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Ações</h2>
          <AcoesConfirmacao agendamentoId={agendamento.id} status={agendamento.status} />
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">Sessões</h2>
        {agendamento.sessoes.length === 0 ? (
          <p>Nenhuma sessão registrada.</p>
        ) : (
          <ul className="list-disc pl-4">
            {agendamento.sessoes.map((sessao) => (
              <li key={sessao.id}>
                {formatarData(sessao.data)} — {sessao.presenca} — {sessao.registradoPor.nome}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">Histórico</h2>
        <ul className="list-disc pl-4">
          {agendamento.eventos.map((evento) => (
            <li key={evento.id}>
              {formatarDataHora(evento.criadoEm)} — {evento.tipo}
              {evento.observacao && ` (${evento.observacao})`} — {evento.usuario?.nome ?? "sistema/paciente"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
