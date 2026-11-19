import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { unidadeDaAgenda } from "@/lib/agenda/horarios";
import { DIAS_DA_SEMANA, DIAS_EXIBIDOS, filtroAgendamentoAtivo, formatarHora, TURNOS } from "@/lib/agendamento/regras";
import { statusDoAgendamento } from "@/lib/atendimento/rotulos";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { prisma } from "@/lib/prisma";
import { Cartao, EstadoVazio } from "../cartao";
import { CarregandoLista } from "../carregando-lista";
import { FormularioAcao } from "../formulario-acao";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { diaDaUrl, OcupacaoSalas } from "../salas/ocupacao-salas";
import { salvarMinhasPreferencias } from "./actions";

export default function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  return (
    <PaginaModulo titulo="Minha agenda" carregando={<CarregandoLista />}>
      <MinhaAgenda searchParams={searchParams} />
    </PaginaModulo>
  );
}

async function MinhaAgenda({ searchParams }: { searchParams: PageProps<"/agenda">["searchParams"] }) {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const unidadeId = unidadeDaAgenda(usuario);
  if (!unidadeId) return <EstadoVazio>Seu cadastro não tem unidade. Fale com a secretaria.</EstadoVazio>;
  const dia = diaDaUrl((await searchParams).dia);

  const [preferencias, pacientes] = await Promise.all([
    prisma.preferenciaEstagiario.findMany({ where: { estagiarioId: usuario.id }, select: { diaSemana: true, turno: true } }),
    prisma.agendamento.findMany({
      where: { estagiarioId: usuario.id, ...filtroAgendamentoAtivo(new Date()) },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: { id: true, diaSemana: true, horaInicio: true, status: true, sala: { select: { nome: true } }, paciente: { select: { nome: true, telefone: true } } },
    }),
  ]);
  const marcadas = new Set(preferencias.map((preferencia) => `${preferencia.diaSemana}:${preferencia.turno}`));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Meus pacientes</h2>
          {pacientes.length === 0 ? (
            <EstadoVazio>Nenhum paciente agendado ainda. Os pacientes designados pelo supervisor aparecem na Lista de espera.</EstadoVazio>
          ) : (
            <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
              {pacientes.map((paciente) => {
                const status = statusDoAgendamento(paciente.status);
                return (
                  <Item key={paciente.id} className="rounded-none">
                    <ItemContent>
                      <ItemTitle className="grid grid-cols-[5.5rem_3.5rem_1fr] text-base font-normal tabular-nums">
                        <span>{DIAS_DA_SEMANA[paciente.diaSemana]}</span>
                        <span>{formatarHora(paciente.horaInicio)}</span>
                        <span>{paciente.sala.nome}</span>
                      </ItemTitle>
                      <ItemDescription className="text-foreground">
                        {paciente.paciente.nome} · {paciente.paciente.telefone}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge variant={status.variante}>{status.rotulo}</Badge>
                    </ItemActions>
                  </Item>
                );
              })}
            </ItemGroup>
          )}
        </section>
        <Cartao titulo="Turnos de preferência">
          <p className="text-sm text-muted-foreground">O supervisor vê estes turnos ao escolher para quem designar cada paciente.</p>
          <FormularioAcao acao={salvarMinhasPreferencias} rotulo="Salvar preferências" larguraTotal>
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-1">Dia</TableHead>
                  {TURNOS.map((turno) => (
                    <TableHead key={turno.valor} className="px-1 text-center">
                      {turno.rotulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {DIAS_EXIBIDOS.map((diaSemana) => (
                  <TableRow key={diaSemana} className="hover:bg-transparent">
                    <TableHead scope="row" className="px-1 font-normal">
                      {DIAS_DA_SEMANA[diaSemana]}
                    </TableHead>
                    {TURNOS.map((turno) => {
                      const valor = `${diaSemana}:${turno.valor}`;
                      return (
                        <TableCell key={turno.valor} className="px-1">
                          <div className="flex justify-center">
                            <Checkbox name="preferencias" value={valor} defaultChecked={marcadas.has(valor)} aria-label={`${DIAS_DA_SEMANA[diaSemana]}, ${turno.rotulo}`} />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FormularioAcao>
        </Cartao>
      </div>
      <OcupacaoSalas unidadeId={unidadeId} dia={dia} unidades={null} estagiarioId={usuario.id} link={({ dia: novoDia }) => `/agenda?dia=${novoDia}`} />
    </div>
  );
}
