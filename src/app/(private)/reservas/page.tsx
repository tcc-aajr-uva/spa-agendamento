import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { descreverHorario } from "@/lib/agenda/horarios";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { estaOcupando } from "@/lib/agendamento/regras";
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

  const horariosLivres = horarios
    .filter((horario) => horario.ocupadoPor === null || !estaOcupando(horario.ocupadoPor, agora))
    .map((horario) => ({ id: horario.id, descricao: descreverHorario(horario.diaSemana, horario.horaInicio) }));

  return (
    <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {reservas.map((reserva) => {
        const descricao = descreverHorario(reserva.diaSemana, reserva.horaInicio);
        const status = statusDoAgendamento(reserva.status);
        return (
          <Item key={reserva.id} className="flex-wrap rounded-none [&_[data-slot=alert]]:basis-full">
            <ItemContent className="basis-full sm:basis-auto">
              <ItemTitle className="text-base font-normal">
                {descricao} — {reserva.sala.nome}
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
      })}
    </ItemGroup>
  );
}
