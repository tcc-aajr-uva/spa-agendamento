import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { descreverHorario, unidadeDaAgenda } from "@/lib/agenda/horarios";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { estaOcupando } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { Cartao, EstadoVazio } from "../cartao";
import { FormularioAcao } from "../formulario-acao";
import { CarregandoLista } from "../carregando-lista";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { DIAS_EXIBIDOS, horariosDaGrade, OcupacaoSalas } from "../salas/ocupacao-salas";
import { adicionarHorario, removerHorario } from "./actions";
import { AvisosDaAgenda, BotaoTrocarHorario, SeletoresHorario } from "./formularios-agenda";

export default function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  return (
    <PaginaModulo titulo="Minha agenda" carregando={<CarregandoLista />}>
      <MeusHorarios searchParams={searchParams} />
    </PaginaModulo>
  );
}

async function MeusHorarios({ searchParams }: { searchParams: PageProps<"/agenda">["searchParams"] }) {
  const usuario = await exigirUsuario(perfisDaRota("/agenda"));
  const unidadeId = unidadeDaAgenda(usuario);
  if (!unidadeId) return <EstadoVazio>Seu cadastro não tem unidade. Fale com a secretaria.</EstadoVazio>;
  const { dia: diaDaUrl } = await searchParams;
  const dia = DIAS_EXIBIDOS.includes(Number(diaDaUrl)) ? Number(diaDaUrl) : DIAS_EXIBIDOS[0];

  const agora = new Date();
  const [horarios, unidade] = await Promise.all([
    prisma.horarioDisponivel.findMany({
      where: { estagiarioId: usuario.id, ativo: true },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: { id: true, diaSemana: true, horaInicio: true, ocupadoPor: { select: { status: true, prazoConfirmacao: true, horarioAtivoId: true } } },
    }),
    prisma.unidade.findUnique({
      where: { id: unidadeId },
      select: { horaAbertura: true, horaFechamento: true, duracaoBlocoMin: true },
    }),
  ]);

  return (
    <AvisosDaAgenda>
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        {horarios.length === 0 ? (
          <EstadoVazio>Nenhum horário cadastrado ainda.</EstadoVazio>
        ) : (
          <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
            {horarios.map((horario) => {
              const descricao = descreverHorario(horario.diaSemana, horario.horaInicio);
              const comPaciente = horario.ocupadoPor !== null && estaOcupando(horario.ocupadoPor, agora);
              return (
                <Item key={horario.id} className="flex-wrap rounded-none [&_[data-slot=alert]]:basis-full">
                  <ItemContent>
                    <ItemTitle className="text-base font-normal">{descricao}</ItemTitle>
                  </ItemContent>
                  <ItemActions className="contents [&>form]:contents">
                    <Badge variant={comPaciente ? "accent" : "outline"}>{comPaciente ? "Com paciente" : "Livre"}</Badge>
                    {!comPaciente && unidade && (
                      <BotaoTrocarHorario horario={{ id: horario.id, diaSemana: horario.diaSemana, horaInicio: horario.horaInicio, descricao }} dias={DIAS_EXIBIDOS} horas={horariosDaGrade(unidade)} />
                    )}
                    <FormularioAcao
                      acao={removerHorario}
                      rotulo="Remover"
                      confirmacao={comPaciente ? `${descricao} tem paciente. Remover mesmo assim?` : `Remover ${descricao} da sua agenda?`}
                      variante="ghost"
                      tamanho="sm"
                    >
                      <input type="hidden" name="horarioId" value={horario.id} />
                    </FormularioAcao>
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
        )}
        {unidade && (
          <Cartao titulo="Novo horário">
            <FormularioAcao acao={adicionarHorario} rotulo="Adicionar horário" larguraTotal>
              <SeletoresHorario id="novo-horario" dias={DIAS_EXIBIDOS} horas={horariosDaGrade(unidade)} />
            </FormularioAcao>
          </Cartao>
        )}
      </div>
      <OcupacaoSalas
        unidadeId={unidadeId}
        dia={dia}
        unidades={null}
        link={({ dia: novoDia }) => `/agenda?dia=${novoDia}`}
      />
    </AvisosDaAgenda>
  );
}
