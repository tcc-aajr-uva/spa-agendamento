import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { rotuloDaPresenca, rotuloDoEvento, rotuloDoMotivo, statusDoAgendamento } from "@/lib/atendimento/rotulos";
import { exigirUsuario, podeAcessar } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora } from "@/lib/agendamento/regras";
import { mascararCpf } from "@/lib/paciente/dados-paciente";
import { prisma } from "@/lib/prisma";
import { CarregandoLista } from "../../carregando-lista";
import { Cartao } from "../../cartao";
import { formatarData, formatarDataHora } from "../../formatar";
import { LinkVoltar } from "../../link-voltar";
import { PaginaModulo } from "../../pagina-modulo";
import { perfisDaRota } from "../../menu";
import { AcoesConfirmacao } from "./acoes-confirmacao";
import { FormSessao } from "./form-sessao";
import { FormTransferencia } from "./form-transferencia";
import { LinkCancelamento } from "./link-cancelamento";

type Parametros = PageProps<"/pacientes/[id]">["params"];

export default function AtendimentoPage({ params }: PageProps<"/pacientes/[id]">) {
  return (
    <PaginaModulo carregando={<CarregandoLista />}>
      <Atendimento parametros={params} />
    </PaginaModulo>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 md:grid-cols-[11rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="wrap-anywhere">{children}</dd>
    </div>
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
      tokens: { where: { tipo: "CANCELAMENTO" }, orderBy: { criadoEm: "desc" }, take: 1, select: { codigo: true } },
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
  const status = statusDoAgendamento(agendamento.status);

  return (
    <div className="flex flex-col gap-4">
      <LinkVoltar href="/pacientes">Voltar para pacientes</LinkVoltar>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{paciente.nome}</h1>
        <Badge variant={status.variante}>{status.rotulo}</Badge>
      </div>

      {agendamento.status === "PENDENTE" && !ativo && (
        <Alert variant="warning">
          <AlertDescription>Prazo de confirmação vencido: o horário será liberado.</AlertDescription>
        </Alert>
      )}

      <div className={ativo ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start" : "grid gap-4"}>
        <div className="flex flex-col gap-4">
          <Cartao titulo="Paciente">
            <dl className="flex flex-col gap-2">
              <Dado rotulo="CPF">{mascararCpf(paciente.cpf)}</Dado>
              <Dado rotulo="Nascimento">{formatarData(paciente.dataNascimento)}</Dado>
              <Dado rotulo="Telefone">{paciente.telefone}</Dado>
              <Dado rotulo="E-mail">{paciente.email}</Dado>
              {paciente.responsavelNome && (
                <Dado rotulo="Responsável">
                  {paciente.responsavelNome} (CPF {mascararCpf(paciente.responsavelCpf ?? "")})
                </Dado>
              )}
            </dl>
          </Cartao>

          <Cartao titulo="Agendamento">
            <dl className="flex flex-col gap-2">
              <Dado rotulo="Unidade e equipe">
                {agendamento.unidade.nome} / {agendamento.equipe.nome}
              </Dado>
              <Dado rotulo="Estagiário">{agendamento.estagiario.nome}</Dado>
              <Dado rotulo="Horário">
                {DIAS_DA_SEMANA[agendamento.diaSemana]} às {formatarHora(agendamento.horaInicio)} — {agendamento.sala.nome}
              </Dado>
              <Dado rotulo="Período">
                de {formatarData(agendamento.dataInicio)} a {formatarData(agendamento.dataFim)}
              </Dado>
              {agendamento.status === "PENDENTE" && <Dado rotulo="Confirmar até">{formatarDataHora(agendamento.prazoConfirmacao)}</Dado>}
              {agendamento.confirmadoEm && <Dado rotulo="Confirmado em">{formatarDataHora(agendamento.confirmadoEm)}</Dado>}
              <Dado rotulo="Termo de consentimento">
                {agendamento.termoAssinadoEm ? `assinado em ${formatarDataHora(agendamento.termoAssinadoEm)}` : "não assinado"}
              </Dado>
              {agendamento.encerradoEm && <Dado rotulo="Encerrado em">{formatarDataHora(agendamento.encerradoEm)}</Dado>}
              {agendamento.motivoEncerramento && <Dado rotulo="Motivo">{rotuloDoMotivo(agendamento.motivoEncerramento)}</Dado>}
            </dl>
          </Cartao>
        </div>

        {ativo && (
          <div className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <FormSessao
              agendamentoId={agendamento.id}
              status={agendamento.status}
              diaSemana={agendamento.diaSemana}
              dataInicio={agendamento.dataInicio}
              dataFim={agendamento.dataFim}
              termoAssinado={agendamento.termoAssinadoEm !== null}
            />
            <AcoesConfirmacao agendamentoId={agendamento.id} status={agendamento.status} />
            <FormTransferencia agendamentoId={agendamento.id} status={agendamento.status} usuario={usuario} />
            <LinkCancelamento agendamentoId={agendamento.id} codigo={agendamento.tokens[0]?.codigo} />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Cartao titulo="Sessões">
            {agendamento.sessoes.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma sessão registrada.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-muted-foreground">
                {agendamento.sessoes.map((sessao) => (
                  <li key={sessao.id}>
                    {formatarData(sessao.data)} — {rotuloDaPresenca(sessao.presenca)} — {sessao.registradoPor.nome}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao titulo="Histórico">
            <ul className="flex flex-col gap-2 text-muted-foreground">
              {agendamento.eventos.map((evento) => (
                <li key={evento.id}>
                  {formatarDataHora(evento.criadoEm)} — {rotuloDoEvento(evento.tipo)}
                  {evento.observacao && ` (${evento.observacao})`} — {evento.usuario?.nome ?? "sistema/paciente"}
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      </div>
    </div>
  );
}
