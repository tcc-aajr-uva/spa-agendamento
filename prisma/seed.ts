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

async function usuario(id: string, nome: string, perfil: Perfil) {
  const dados = { nome, email: `${id}@spa.teste`, perfil };
  await prisma.usuario.upsert({ where: { id }, create: { id, ...dados }, update: dados });
}

async function vincularUnidade(usuarioId: string, unidadeId: string) {
  await prisma.usuarioUnidade.upsert({
    where: { usuarioId_unidadeId: { usuarioId, unidadeId } },
    create: { usuarioId, unidadeId },
    update: { ativo: true },
  });
}

async function vincularEquipe(usuarioId: string, equipeId: string, unidadeId: string) {
  await prisma.usuarioEquipe.upsert({
    where: { usuarioId_equipeId: { usuarioId, equipeId } },
    create: { usuarioId, equipeId, unidadeId },
    update: { unidadeId, ativo: true },
  });
}

async function main() {
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

    const secretariaId = `${unidade.id}-secretaria`;
    await usuario(secretariaId, `Secretaria ${unidade.nome}`, "SECRETARIA");
    await vincularUnidade(secretariaId, unidade.id);

    for (const equipe of EQUIPES) {
      const equipeId = `${unidade.id}-${equipe.sufixo}`;
      const supervisorId = `${equipeId}-supervisor`;
      await prisma.equipe.upsert({
        where: { id: equipeId },
        create: { id: equipeId, unidadeId: unidade.id, nome: equipe.nome },
        update: { nome: equipe.nome },
      });
      await usuario(supervisorId, `Supervisor ${equipe.nome} ${unidade.nome}`, "SUPERVISOR");
      await vincularUnidade(supervisorId, unidade.id);
      await vincularEquipe(supervisorId, equipeId, unidade.id);
      await prisma.equipe.update({ where: { id: equipeId }, data: { supervisorId } });

      for (const [indice, horarios] of HORARIOS_POR_ESTAGIARIO.entries()) {
        const estagiarioId = `${equipeId}-estagiario-${indice + 1}`;
        await usuario(estagiarioId, `Estagiário ${indice + 1} ${equipe.nome} ${unidade.nome}`, "ESTAGIARIO");
        await vincularUnidade(estagiarioId, unidade.id);
        await vincularEquipe(estagiarioId, equipeId, unidade.id);
        await prisma.configuracaoAtendimentoEstagiario.upsert({
          where: { estagiarioId_equipeId_periodoLetivoId: { estagiarioId, equipeId, periodoLetivoId: periodoId } },
          create: {
            estagiarioId,
            equipeId,
            unidadeId: unidade.id,
            periodoLetivoId: periodoId,
            liberado: true,
            limitePacientes: 2,
          },
          update: {
            unidadeId: unidade.id,
            liberado: true,
            limitePacientes: 2,
          },
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

const PACIENTES = [
  { id: "seed-paciente-1", nome: "Paciente Confirmado", cpf: "52998224725" },
  { id: "seed-paciente-2", nome: "Paciente Pendente", cpf: "11144477735" },
  { id: "seed-paciente-3", nome: "Paciente Pendente Vencido", cpf: "15350946056" },
  { id: "seed-paciente-4", nome: "Paciente Na Lista", cpf: "86288366757" },
];

async function exemplosDeAgendamento() {
  for (const paciente of PACIENTES) {
    const dados = { nome: paciente.nome, cpf: paciente.cpf, dataNascimento: new Date("1995-05-10T00:00:00Z"), telefone: "21999990000", email: `${paciente.id}@spa.teste` };
    await prisma.paciente.upsert({ where: { id: paciente.id }, create: { id: paciente.id, ...dados }, update: dados });
  }

  const equipeId = "seed-unidade-tijuca-neuro";
  const exemplos = [
    { id: "seed-agendamento-confirmado", pacienteId: "seed-paciente-1", estagiario: 1, horario: 0, sala: 1, status: "CONFIRMADO" as const, prazo: -24 },
    { id: "seed-agendamento-pendente", pacienteId: "seed-paciente-2", estagiario: 1, horario: 1, sala: 1, status: "PENDENTE" as const, prazo: 6 },
    { id: "seed-agendamento-vencido", pacienteId: "seed-paciente-3", estagiario: 2, horario: 0, sala: 2, status: "PENDENTE" as const, prazo: -2 },
  ];

  for (const exemplo of exemplos) {
    const estagiarioId = `${equipeId}-estagiario-${exemplo.estagiario}`;
    const { diaSemana, horaInicio } = HORARIOS_POR_ESTAGIARIO[exemplo.estagiario - 1][exemplo.horario];
    const horario = await prisma.horarioDisponivel.findUniqueOrThrow({
      where: { estagiarioId_diaSemana_horaInicio: { estagiarioId, diaSemana, horaInicio } },
      select: { id: true },
    });
    const salaId = `seed-unidade-tijuca-sala-${exemplo.sala}`;
    const dados = {
      unidadeId: "seed-unidade-tijuca",
      equipeId,
      horarioDisponivelId: horario.id,
      estagiarioId,
      salaId,
      pacienteId: exemplo.pacienteId,
      diaSemana,
      horaInicio,
      status: exemplo.status,
      dataInicio: hoje,
      dataFim: new Date(hoje.getTime() + 120 * UM_DIA_MS),
      prazoConfirmacao: new Date(agora.getTime() + exemplo.prazo * UMA_HORA_MS),
      confirmadoEm: exemplo.status === "CONFIRMADO" ? agora : null,
      motivoEncerramento: null,
      encerradoEm: null,
      horarioAtivoId: horario.id,
      salaAtivaChave: `${salaId}:${diaSemana}:${horaInicio}`,
      pacienteAtivoId: exemplo.pacienteId,
    };
    await prisma.agendamento.upsert({
      where: { id: exemplo.id },
      create: { id: exemplo.id, ...dados, eventos: { create: { tipo: "CRIADO" } } },
      update: dados,
    });
  }

  const lista = { unidadeId: "seed-unidade-tijuca", equipeId: "seed-unidade-tijuca-infantil", pacienteId: "seed-paciente-4", pacienteAtivoId: "seed-paciente-4" };
  await prisma.listaEspera.upsert({ where: { id: "seed-lista-1" }, create: { id: "seed-lista-1", ...lista }, update: { ...lista, status: "AGUARDANDO" } });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erro) => {
    console.error(erro);
    await prisma.$disconnect();
    process.exit(1);
  });
