import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Perfil } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const UMA_HORA_MS = 60 * 60 * 1000;
const agora = new Date();
const hoje = new Date(`${agora.toISOString().slice(0, 10)}T00:00:00Z`);
const segundoSemestre = agora.getUTCMonth() >= 6;
const inicioPeriodo = new Date(Date.UTC(agora.getUTCFullYear(), segundoSemestre ? 6 : 0, 1));
const fimPeriodo = new Date(Date.UTC(agora.getUTCFullYear(), segundoSemestre ? 11 : 5, segundoSemestre ? 31 : 30));

const UNIDADES = [
  { chave: "tijuca", nome: "Tijuca", agendamentoAberto: true },
  { chave: "barra", nome: "Barra", agendamentoAberto: false },
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

async function usuario(chave: string, nome: string, perfil: Perfil) {
  const dados = { nome, email: `${chave}@spa.teste`, perfil };
  return prisma.usuario.upsert({
    where: { email: dados.email },
    create: dados,
    update: { nome, perfil },
    select: { id: true },
  });
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
    const unidadeExistente = await prisma.unidade.findFirst({
      where: { nome: unidade.nome },
      select: { id: true },
    });
    const unidadeSalva = unidadeExistente
      ? await prisma.unidade.update({
          where: { id: unidadeExistente.id },
          data: dadosUnidade,
          select: { id: true },
        })
      : await prisma.unidade.create({ data: dadosUnidade, select: { id: true } });

    const periodoSalvo =
      (await prisma.periodoLetivo.findFirst({
        where: { unidadeId: unidadeSalva.id, inicio: inicioPeriodo, fim: fimPeriodo },
        select: { id: true },
      })) ??
      (await prisma.periodoLetivo.create({
        data: { unidadeId: unidadeSalva.id, inicio: inicioPeriodo, fim: fimPeriodo },
        select: { id: true },
      }));

    for (const numero of [1, 2, 3]) {
      await prisma.sala.upsert({
        where: { unidadeId_nome: { unidadeId: unidadeSalva.id, nome: `Sala ${numero}` } },
        create: { unidadeId: unidadeSalva.id, nome: `Sala ${numero}` },
        update: { ativa: true },
      });
    }

    const secretaria = await usuario(
      `seed-unidade-${unidade.chave}-secretaria`,
      `Secretaria ${unidade.nome}`,
      "SECRETARIA",
    );
    await vincularUnidade(secretaria.id, unidadeSalva.id);

    for (const equipe of EQUIPES) {
      const chaveEquipe = `seed-unidade-${unidade.chave}-${equipe.sufixo}`;
      const equipeSalva = await prisma.equipe.upsert({
        where: { unidadeId_nome: { unidadeId: unidadeSalva.id, nome: equipe.nome } },
        create: { unidadeId: unidadeSalva.id, nome: equipe.nome },
        update: { ativa: true },
        select: { id: true },
      });
      const supervisor = await usuario(
        `${chaveEquipe}-supervisor`,
        `Supervisor ${equipe.nome} ${unidade.nome}`,
        "SUPERVISOR",
      );
      await vincularUnidade(supervisor.id, unidadeSalva.id);
      await vincularEquipe(supervisor.id, equipeSalva.id, unidadeSalva.id);
      await prisma.equipe.update({ where: { id: equipeSalva.id }, data: { supervisorId: supervisor.id } });

      for (const [indice, horarios] of HORARIOS_POR_ESTAGIARIO.entries()) {
        const estagiario = await usuario(
          `${chaveEquipe}-estagiario-${indice + 1}`,
          `Estagiário ${indice + 1} ${equipe.nome} ${unidade.nome}`,
          "ESTAGIARIO",
        );
        await vincularUnidade(estagiario.id, unidadeSalva.id);
        await vincularEquipe(estagiario.id, equipeSalva.id, unidadeSalva.id);
        await prisma.configuracaoAtendimentoEstagiario.upsert({
          where: {
            estagiarioId_equipeId_periodoLetivoId: {
              estagiarioId: estagiario.id,
              equipeId: equipeSalva.id,
              periodoLetivoId: periodoSalvo.id,
            },
          },
          create: {
            estagiarioId: estagiario.id,
            equipeId: equipeSalva.id,
            unidadeId: unidadeSalva.id,
            periodoLetivoId: periodoSalvo.id,
            liberado: true,
            limitePacientes: 2,
          },
          update: {
            unidadeId: unidadeSalva.id,
            liberado: true,
            limitePacientes: 2,
          },
        });
        for (const horario of horarios) {
          await prisma.horarioDisponivel.upsert({
            where: { estagiarioId_diaSemana_horaInicio: { estagiarioId: estagiario.id, ...horario } },
            create: { estagiarioId: estagiario.id, ...horario },
            update: { ativo: true },
          });
        }
      }
    }
  }

  await exemplosDeAgendamento();
}

const PACIENTES = [
  { chave: "seed-paciente-1", nome: "Paciente Confirmado", cpf: "52998224725" },
  { chave: "seed-paciente-2", nome: "Paciente Pendente", cpf: "11144477735" },
  { chave: "seed-paciente-3", nome: "Paciente Pendente Vencido", cpf: "15350946056" },
  { chave: "seed-paciente-4", nome: "Paciente Na Lista", cpf: "86288366757" },
];

async function exemplosDeAgendamento() {
  const pacientes = new Map<string, string>();
  for (const paciente of PACIENTES) {
    const dados = { nome: paciente.nome, dataNascimento: new Date("1995-05-10T00:00:00Z"), telefone: "21999990000", email: `${paciente.chave}@spa.teste` };
    const pacienteSalvo = await prisma.paciente.upsert({
      where: { cpf: paciente.cpf },
      create: { cpf: paciente.cpf, ...dados },
      update: dados,
      select: { id: true },
    });
    pacientes.set(paciente.chave, pacienteSalvo.id);
  }

  const unidade = await prisma.unidade.findFirstOrThrow({
    where: { nome: "Tijuca" },
    select: { id: true },
  });
  const equipe = await prisma.equipe.findUniqueOrThrow({
    where: { unidadeId_nome: { unidadeId: unidade.id, nome: EQUIPES[0].nome } },
    select: { id: true },
  });
  const exemplos = [
    { paciente: "seed-paciente-1", estagiario: 1, horario: 0, sala: 1, status: "CONFIRMADO" as const, prazo: -24 },
    { paciente: "seed-paciente-2", estagiario: 1, horario: 1, sala: 1, status: "PENDENTE" as const, prazo: 6 },
    { paciente: "seed-paciente-3", estagiario: 2, horario: 0, sala: 2, status: "PENDENTE" as const, prazo: -2 },
  ];

  for (const exemplo of exemplos) {
    const pacienteId = pacientes.get(exemplo.paciente);
    if (!pacienteId) throw new Error(`Paciente de demonstração não encontrado: ${exemplo.paciente}`);
    const estagiario = await prisma.usuario.findUniqueOrThrow({
      where: { email: `seed-unidade-tijuca-neuro-estagiario-${exemplo.estagiario}@spa.teste` },
      select: { id: true },
    });
    const { diaSemana, horaInicio } = HORARIOS_POR_ESTAGIARIO[exemplo.estagiario - 1][exemplo.horario];
    const horario = await prisma.horarioDisponivel.findUniqueOrThrow({
      where: { estagiarioId_diaSemana_horaInicio: { estagiarioId: estagiario.id, diaSemana, horaInicio } },
      select: { id: true },
    });
    const sala = await prisma.sala.findUniqueOrThrow({
      where: { unidadeId_nome: { unidadeId: unidade.id, nome: `Sala ${exemplo.sala}` } },
      select: { id: true },
    });
    const dados = {
      unidadeId: unidade.id,
      equipeId: equipe.id,
      horarioDisponivelId: horario.id,
      estagiarioId: estagiario.id,
      salaId: sala.id,
      pacienteId,
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
      salaAtivaChave: `${sala.id}:${diaSemana}:${horaInicio}`,
      pacienteAtivoId: pacienteId,
    };
    await prisma.agendamento.upsert({
      where: { pacienteAtivoId: pacienteId },
      create: { ...dados, eventos: { create: { tipo: "CRIADO" } } },
      update: dados,
    });
  }

  const equipeInfantil = await prisma.equipe.findUniqueOrThrow({
    where: { unidadeId_nome: { unidadeId: unidade.id, nome: EQUIPES[1].nome } },
    select: { id: true },
  });
  const pacienteListaId = pacientes.get("seed-paciente-4");
  if (!pacienteListaId) throw new Error("Paciente da lista de espera não encontrado.");
  const lista = {
    unidadeId: unidade.id,
    equipeId: equipeInfantil.id,
    pacienteId: pacienteListaId,
    pacienteAtivoId: pacienteListaId,
  };
  await prisma.listaEspera.upsert({
    where: { pacienteAtivoId: pacienteListaId },
    create: lista,
    update: { ...lista, status: "AGUARDANDO" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erro) => {
    console.error(erro);
    await prisma.$disconnect();
    process.exit(1);
  });
