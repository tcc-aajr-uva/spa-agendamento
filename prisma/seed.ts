import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Perfil } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const UMA_HORA_MS = 60 * 60 * 1000;
const agora = new Date();
const hoje = new Date(`${agora.toISOString().slice(0, 10)}T00:00:00Z`);

const UNIDADES = [
  { id: "seed-unidade-tijuca", nome: "Tijuca", agendamentoAberto: true },
  { id: "seed-unidade-barra", nome: "Barra", agendamentoAberto: false },
];

const EQUIPES = [
  { sufixo: "neuro", nome: "Avaliação neuropsicológica" },
  { sufixo: "infantil", nome: "Infantil" },
];

const HORARIOS_POR_ESTAGIARIO = [
  [
    { diaSemana: 1, horaInicio: 1080 },
    { diaSemana: 3, horaInicio: 1080 },
  ],
  [
    { diaSemana: 2, horaInicio: 1130 },
    { diaSemana: 4, horaInicio: 1130 },
  ],
];

async function usuario(id: string, nome: string, perfil: Perfil, extra: { unidadeId?: string; equipeId?: string; liberado?: boolean; limitePacientes?: number } = {}) {
  const dados = { nome, email: `${id}@spa.teste`, perfil, ...extra };
  await prisma.usuario.upsert({ where: { id }, create: { id, ...dados }, update: dados });
}

async function main() {
  await usuario("seed-coordenacao", "Coordenação Geral", "COORDENACAO");

  for (const unidade of UNIDADES) {
    const dadosUnidade = { nome: unidade.nome, agendamentoAberto: unidade.agendamentoAberto };
    await prisma.unidade.upsert({ where: { id: unidade.id }, create: { id: unidade.id, ...dadosUnidade }, update: dadosUnidade });

    const periodoId = `${unidade.id}-periodo`;
    const periodo = { unidadeId: unidade.id, inicio: new Date(hoje.getTime() - 30 * UM_DIA_MS), fim: new Date(hoje.getTime() + 120 * UM_DIA_MS) };
    await prisma.periodoLetivo.upsert({ where: { id: periodoId }, create: { id: periodoId, ...periodo }, update: periodo });

    for (const numero of [1, 2, 3]) {
      const salaId = `${unidade.id}-sala-${numero}`;
      await prisma.sala.upsert({
        where: { id: salaId },
        create: { id: salaId, unidadeId: unidade.id, nome: `Sala ${numero}` },
        update: { nome: `Sala ${numero}` },
      });
    }

    await usuario(`${unidade.id}-secretaria`, `Secretaria ${unidade.nome}`, "SECRETARIA", { unidadeId: unidade.id });

    for (const equipe of EQUIPES) {
      const equipeId = `${unidade.id}-${equipe.sufixo}`;
      const supervisorId = `${equipeId}-supervisor`;
      await prisma.equipe.upsert({
        where: { id: equipeId },
        create: { id: equipeId, unidadeId: unidade.id, nome: equipe.nome },
        update: { nome: equipe.nome },
      });
      await usuario(supervisorId, `Supervisor ${equipe.nome} ${unidade.nome}`, "SUPERVISOR", { unidadeId: unidade.id, equipeId });
      await prisma.equipe.update({ where: { id: equipeId }, data: { supervisorId } });

      for (const [indice, horarios] of HORARIOS_POR_ESTAGIARIO.entries()) {
        const estagiarioId = `${equipeId}-estagiario-${indice + 1}`;
        await usuario(estagiarioId, `Estagiário ${indice + 1} ${equipe.nome} ${unidade.nome}`, "ESTAGIARIO", {
          unidadeId: unidade.id,
          equipeId,
          liberado: true,
          limitePacientes: 2,
        });
        for (const horario of horarios) {
          await prisma.horarioDisponivel.upsert({
            where: { estagiarioId_diaSemana_horaInicio: { estagiarioId, ...horario } },
            create: { estagiarioId, ...horario },
            update: { ativo: true },
          });
        }
      }
    }
  }

  await exemplosDeAgendamento();
}

const PACIENTES_NA_LISTA = 25;

const PACIENTES = [
  { id: "seed-paciente-1", nome: "Paciente Confirmado Sem Sessões", cpf: "52998224725" },
  { id: "seed-paciente-2", nome: "Paciente Pendente", cpf: "11144477735" },
  { id: "seed-paciente-3", nome: "Paciente Pendente Vencido", cpf: "15350946056" },
  { id: "seed-paciente-4", nome: "Paciente Na Lista", cpf: "86288366757" },
  { id: "seed-paciente-5", nome: "Paciente Duas Faltas", cpf: cpfDeTeste(310000001) },
  { id: "seed-paciente-6", nome: "Paciente Sem Termo", cpf: cpfDeTeste(310000002) },
  { id: "seed-paciente-7", nome: "Paciente Período Encerrado", cpf: cpfDeTeste(310000003) },
  ...Array.from({ length: PACIENTES_NA_LISTA }, (_, indice) => {
    const numero = String(indice + 1).padStart(2, "0");
    return { id: `seed-paciente-lista-${numero}`, nome: `Paciente Lista ${numero}`, cpf: cpfDeTeste(320000000 + (indice + 1) * 12347) };
  }),
];

type Sessao = { semanasAtras: number; presenca: "PRESENTE" | "FALTA" | "FALTA_JUSTIFICADA" };

type Exemplo = {
  id: string;
  pacienteId: string;
  unidade: "tijuca" | "barra";
  equipe: "neuro" | "infantil";
  estagiario: number;
  horario: number;
  sala: number;
  status: "PENDENTE" | "CONFIRMADO";
  prazoHoras: number;
  inicioSemanasAtras?: number;
  fimEmDias?: number;
  termoAssinado?: boolean;
  sessoes?: Sessao[];
};

const EXEMPLOS: Exemplo[] = [
  { id: "seed-agendamento-confirmado", pacienteId: "seed-paciente-1", unidade: "tijuca", equipe: "neuro", estagiario: 1, horario: 0, sala: 1, status: "CONFIRMADO", prazoHoras: -24, inicioSemanasAtras: 2 },
  { id: "seed-agendamento-pendente", pacienteId: "seed-paciente-2", unidade: "tijuca", equipe: "neuro", estagiario: 1, horario: 1, sala: 1, status: "PENDENTE", prazoHoras: 6 },
  { id: "seed-agendamento-vencido", pacienteId: "seed-paciente-3", unidade: "tijuca", equipe: "neuro", estagiario: 2, horario: 0, sala: 2, status: "PENDENTE", prazoHoras: -2 },
  {
    id: "seed-agendamento-duas-faltas",
    pacienteId: "seed-paciente-5",
    unidade: "tijuca",
    equipe: "infantil",
    estagiario: 1,
    horario: 0,
    sala: 2,
    status: "CONFIRMADO",
    prazoHoras: -24 * 28,
    inicioSemanasAtras: 4,
    termoAssinado: true,
    sessoes: [
      { semanasAtras: 4, presenca: "PRESENTE" },
      { semanasAtras: 3, presenca: "FALTA" },
      { semanasAtras: 2, presenca: "FALTA_JUSTIFICADA" },
    ],
  },
  {
    id: "seed-agendamento-sem-termo",
    pacienteId: "seed-paciente-6",
    unidade: "tijuca",
    equipe: "infantil",
    estagiario: 1,
    horario: 1,
    sala: 2,
    status: "CONFIRMADO",
    prazoHoras: -24 * 14,
    inicioSemanasAtras: 2,
    sessoes: [{ semanasAtras: 2, presenca: "PRESENTE" }],
  },
  {
    id: "seed-agendamento-periodo-encerrado",
    pacienteId: "seed-paciente-7",
    unidade: "barra",
    equipe: "neuro",
    estagiario: 1,
    horario: 0,
    sala: 1,
    status: "CONFIRMADO",
    prazoHoras: -24 * 70,
    inicioSemanasAtras: 10,
    fimEmDias: -1,
    termoAssinado: true,
  },
];

function cpfDeTeste(numero: number): string {
  const base = String(numero).padStart(9, "0").slice(-9).split("").map(Number);
  const digito = (digitos: number[]) => {
    const soma = digitos.reduce((total, valor, indice) => total + valor * (digitos.length + 1 - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const primeiro = digito(base);
  return [...base, primeiro, digito([...base, primeiro])].join("");
}

function ocorrencia(diaSemana: number, semanasAtras: number): Date {
  const diasDesde = (hoje.getUTCDay() - diaSemana + 7) % 7;
  return new Date(hoje.getTime() - (diasDesde + semanasAtras * 7) * UM_DIA_MS);
}

async function exemplosDeAgendamento() {
  for (const paciente of PACIENTES) {
    const dados = { nome: paciente.nome, cpf: paciente.cpf, dataNascimento: new Date("1995-05-10T00:00:00Z"), telefone: "21999990000", email: `${paciente.id}@spa.teste` };
    await prisma.paciente.upsert({ where: { id: paciente.id }, create: { id: paciente.id, ...dados }, update: dados });
  }

  const preparados = [];
  for (const exemplo of EXEMPLOS) {
    const unidadeId = `seed-unidade-${exemplo.unidade}`;
    const equipeId = `${unidadeId}-${exemplo.equipe}`;
    const estagiarioId = `${equipeId}-estagiario-${exemplo.estagiario}`;
    const { diaSemana, horaInicio } = HORARIOS_POR_ESTAGIARIO[exemplo.estagiario - 1][exemplo.horario];
    const horario = await prisma.horarioDisponivel.findUniqueOrThrow({
      where: { estagiarioId_diaSemana_horaInicio: { estagiarioId, diaSemana, horaInicio } },
      select: { id: true },
    });
    const salaId = `${unidadeId}-sala-${exemplo.sala}`;
    preparados.push({ exemplo, unidadeId, equipeId, estagiarioId, diaSemana, horaInicio, horarioId: horario.id, salaId, salaChave: `${salaId}:${diaSemana}:${horaInicio}` });
  }

  const naoSeed = { NOT: { id: { startsWith: "seed-" } } };
  await prisma.agendamento.updateMany({
    where: {
      ...naoSeed,
      horarioAtivoId: { not: null },
      OR: [
        { pacienteId: { in: PACIENTES.map((paciente) => paciente.id) } },
        { horarioAtivoId: { in: preparados.map((preparado) => preparado.horarioId) } },
        { salaAtivaChave: { in: preparados.map((preparado) => preparado.salaChave) } },
      ],
    },
    data: { horarioAtivoId: null, salaAtivaChave: null, pacienteAtivoId: null, status: "CANCELADO", encerradoEm: agora },
  });
  await prisma.sessao.deleteMany({ where: { ...naoSeed, agendamentoId: { in: EXEMPLOS.map((exemplo) => exemplo.id) } } });

  for (const { exemplo, unidadeId, equipeId, estagiarioId, diaSemana, horaInicio, horarioId, salaId, salaChave } of preparados) {
    const dados = {
      unidadeId,
      equipeId,
      horarioDisponivelId: horarioId,
      estagiarioId,
      salaId,
      pacienteId: exemplo.pacienteId,
      diaSemana,
      horaInicio,
      status: exemplo.status,
      dataInicio: exemplo.inicioSemanasAtras === undefined ? hoje : ocorrencia(diaSemana, exemplo.inicioSemanasAtras),
      dataFim: new Date(hoje.getTime() + (exemplo.fimEmDias ?? 120) * UM_DIA_MS),
      prazoConfirmacao: new Date(agora.getTime() + exemplo.prazoHoras * UMA_HORA_MS),
      confirmadoEm: exemplo.status === "CONFIRMADO" ? agora : null,
      termoAssinadoEm: exemplo.termoAssinado ? agora : null,
      motivoEncerramento: null,
      encerradoEm: null,
      horarioAtivoId: horarioId,
      salaAtivaChave: salaChave,
      pacienteAtivoId: exemplo.pacienteId,
    };
    await prisma.agendamento.upsert({
      where: { id: exemplo.id },
      create: { id: exemplo.id, ...dados, eventos: { create: { tipo: "CRIADO" } } },
      update: dados,
    });

    for (const sessao of exemplo.sessoes ?? []) {
      const id = `${exemplo.id}-sessao-${sessao.semanasAtras}`;
      const dadosSessao = { agendamentoId: exemplo.id, data: ocorrencia(diaSemana, sessao.semanasAtras), presenca: sessao.presenca, registradoPorId: estagiarioId };
      await prisma.sessao.upsert({ where: { id }, create: { id, ...dadosSessao }, update: dadosSessao });
    }
  }

  const listaInfantil = { unidadeId: "seed-unidade-tijuca", equipeId: "seed-unidade-tijuca-infantil" };
  const inscricoes = [
    { id: "seed-lista-1", pacienteId: "seed-paciente-4", inscritoEm: new Date(agora.getTime() - 40 * UM_DIA_MS) },
    ...PACIENTES.filter((paciente) => paciente.id.startsWith("seed-paciente-lista-")).map((paciente, indice) => ({
      id: `seed-lista-${indice + 2}`,
      pacienteId: paciente.id,
      inscritoEm: new Date(agora.getTime() - (30 - indice) * UM_DIA_MS),
    })),
  ];
  for (const inscricao of inscricoes) {
    const dados = { ...listaInfantil, pacienteId: inscricao.pacienteId, pacienteAtivoId: inscricao.pacienteId, inscritoEm: inscricao.inscritoEm, status: "AGUARDANDO" as const };
    await prisma.listaEspera.upsert({ where: { id: inscricao.id }, create: { id: inscricao.id, ...dados }, update: dados });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erro) => {
    console.error(erro);
    await prisma.$disconnect();
    process.exit(1);
  });
