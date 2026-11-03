import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { descreverHorario } from "@/lib/agenda/horarios";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { DIAS_DA_SEMANA, estaOcupando, formatarHora } from "@/lib/agendamento/regras";
import { statusDoAgendamento } from "@/lib/atendimento/rotulos";
import { prisma } from "@/lib/prisma";
import { EstadoVazio } from "../cartao";
import { FormularioAcao } from "../formulario-acao";
import { CarregandoLista } from "../carregando-lista";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { cancelarReserva } from "./actions";
import { BotaoRemarcarReserva } from "./botao-remarcar";

export default function ReservasPage() {
  return (
    <PaginaModulo titulo="Minhas reservas" carregando={<CarregandoLista />}>
      <MinhasReservas />
    </PaginaModulo>
  );
}

async function MinhasReservas() {
  const usuario = await exigirUsuario(perfisDaRota("/reservas"));
  const agora = new Date();
  const [reservas, horarios] = await Promise.all([
    prisma.agendamento.findMany({
      where: { estagiarioId: usuario.id },
      orderBy: [{ criadoEm: "desc" }],
      take: 50,
      select: {
        id: true,
        diaSemana: true,
        horaInicio: true,
        status: true,
        prazoConfirmacao: true,
        horarioAtivoId: true,
        sala: { select: { nome: true } },
      },
    }),
    prisma.horarioDisponivel.findMany({
      where: { estagiarioId: usuario.id, ativo: true },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: { id: true, diaSemana: true, horaInicio: true, ocupadoPor: { select: { status: true, prazoConfirmacao: true, horarioAtivoId: true } } },
    }),
  ]);

  if (reservas.length === 0) return <EstadoVazio>Nenhuma reserva.</EstadoVazio>;

  reservas.sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio - b.horaInicio);
  const ativas = reservas.filter((reserva) => reserva.horarioAtivoId);
  const historico = reservas.filter((reserva) => !reserva.horarioAtivoId);

  const horariosLivres = horarios
    .filter((horario) => horario.ocupadoPor === null || !estaOcupando(horario.ocupadoPor, agora))
    .map((horario) => ({ id: horario.id, descricao: descreverHorario(horario.diaSemana, horario.horaInicio) }));

  const linha = (reserva: (typeof reservas)[number]) => {
    const descricao = descreverHorario(reserva.diaSemana, reserva.horaInicio);
    const status = statusDoAgendamento(reserva.status);
    return (
      <Item key={reserva.id} className="flex-wrap rounded-none [&_[data-slot=alert]]:basis-full">
        <ItemContent className="basis-full sm:basis-auto">
          <ItemTitle className={`grid grid-cols-[5.5rem_3.5rem_1fr] text-base font-normal tabular-nums ${reserva.horarioAtivoId ? "" : "text-muted-foreground"}`}>
            <span>{DIAS_DA_SEMANA[reserva.diaSemana]}</span>
            <span>{formatarHora(reserva.horaInicio)}</span>
            <span>{reserva.sala.nome}</span>
          </ItemTitle>
        </ItemContent>
        <ItemActions className="contents [&>form]:contents">
          <Badge variant={status.variante}>{status.rotulo}</Badge>
          {estaOcupando(reserva, agora) && <BotaoRemarcarReserva agendamentoId={reserva.id} descricao={descricao} horarios={horariosLivres} />}
          {reserva.horarioAtivoId && (
            <FormularioAcao
              acao={cancelarReserva}
              rotulo="Cancelar"
              confirmacao={`Cancelar a reserva de ${descricao}? O horário volta a ficar livre.`}
              variante="destructive"
              tamanho="sm"
            >
              <input type="hidden" name="agendamentoId" value={reserva.id} />
            </FormularioAcao>
          )}
        </ItemActions>
      </Item>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {ativas.length === 0 ? (
        <EstadoVazio>Nenhuma reserva ativa.</EstadoVazio>
      ) : (
        <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">{ativas.map(linha)}</ItemGroup>
      )}
      {historico.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Encerradas e canceladas</h2>
          <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-muted/50 ring-1 ring-foreground/10">{historico.map(linha)}</ItemGroup>
        </section>
      )}
    </div>
  );
}
