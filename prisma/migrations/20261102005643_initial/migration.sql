-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMINISTRADOR', 'COORDENACAO', 'SECRETARIA', 'SUPERVISOR', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'EM_ATENDIMENTO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MotivoEncerramento" AS ENUM ('NAO_CONFIRMADO', 'NAO_LOCALIZADO', 'DESISTENCIA', 'FALTA_PRIMEIRA_SESSAO', 'TRES_FALTAS', 'CANCELADO_PELO_PACIENTE', 'CANCELADO_PELO_ESTAGIARIO', 'TRANSFERENCIA', 'ALTA', 'FIM_DO_PERIODO');

-- CreateEnum
CREATE TYPE "Presenca" AS ENUM ('PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CRIADO', 'CONFIRMADO', 'CANCELADO', 'REMARCADO', 'FALTA', 'TERMO_ASSINADO', 'TRANSFERIDO', 'ENCERRADO', 'LINK_CANCELAMENTO_GERADO');

-- CreateEnum
CREATE TYPE "StatusListaEspera" AS ENUM ('AGUARDANDO', 'CHAMADO', 'REMOVIDO');

-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('CANCELAMENTO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "imagem" TEXT,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioUnidade" (
    "usuarioId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioUnidade_pkey" PRIMARY KEY ("usuarioId","unidadeId")
);

-- CreateTable
CREATE TABLE "UsuarioEquipe" (
    "usuarioId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioEquipe_pkey" PRIMARY KEY ("usuarioId","equipeId")
);

-- CreateTable
CREATE TABLE "Convite" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "revogadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoAutenticacao" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SessaoAutenticacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaAutenticacao" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaAutenticacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificacaoAutenticacao" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificacaoAutenticacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimiteRequisicao" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "LimiteRequisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "permitePaciente" BOOLEAN NOT NULL DEFAULT true,
    "permiteEstagiario" BOOLEAN NOT NULL DEFAULT true,
    "permiteSecretaria" BOOLEAN NOT NULL DEFAULT true,
    "agendamentoAberto" BOOLEAN NOT NULL DEFAULT false,
    "horaAbertura" INTEGER NOT NULL DEFAULT 480,
    "horaFechamento" INTEGER NOT NULL DEFAULT 1260,
    "duracaoBlocoMin" INTEGER NOT NULL DEFAULT 50,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "supervisorId" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoLetivo" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,

    CONSTRAINT "PeriodoLetivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoAtendimentoEstagiario" (
    "estagiarioId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "periodoLetivoId" TEXT NOT NULL,
    "liberado" BOOLEAN NOT NULL DEFAULT false,
    "limitePacientes" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoAtendimentoEstagiario_pkey" PRIMARY KEY ("estagiarioId","equipeId","periodoLetivoId")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioDisponivel" (
    "id" TEXT NOT NULL,
    "estagiarioId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorarioDisponivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dataNascimento" DATE NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "responsavelNome" TEXT,
    "responsavelCpf" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "horarioDisponivelId" TEXT NOT NULL,
    "estagiarioId" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" INTEGER NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "prazoConfirmacao" TIMESTAMP(3) NOT NULL,
    "confirmadoEm" TIMESTAMP(3),
    "termoAssinadoEm" TIMESTAMP(3),
    "motivoEncerramento" "MotivoEncerramento",
    "encerradoEm" TIMESTAMP(3),
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horarioAtivoId" TEXT,
    "salaAtivaChave" TEXT,
    "pacienteAtivoId" TEXT,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "presenca" "Presenca" NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoAgendamento" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "usuarioId" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAgendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaEspera" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "status" "StatusListaEspera" NOT NULL DEFAULT 'AGUARDANDO',
    "inscritoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "pacienteAtivoId" TEXT,

    CONSTRAINT "ListaEspera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenAcesso" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoToken" NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_perfil_ativo_idx" ON "Usuario"("perfil", "ativo");

-- CreateIndex
CREATE INDEX "UsuarioUnidade_unidadeId_ativo_idx" ON "UsuarioUnidade"("unidadeId", "ativo");

-- CreateIndex
CREATE INDEX "UsuarioEquipe_equipeId_ativo_idx" ON "UsuarioEquipe"("equipeId", "ativo");

-- CreateIndex
CREATE INDEX "UsuarioEquipe_unidadeId_ativo_idx" ON "UsuarioEquipe"("unidadeId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioEquipe_usuarioId_equipeId_unidadeId_key" ON "UsuarioEquipe"("usuarioId", "equipeId", "unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Convite_tokenHash_key" ON "Convite"("tokenHash");

-- CreateIndex
CREATE INDEX "Convite_usuarioId_idx" ON "Convite"("usuarioId");

-- CreateIndex
CREATE INDEX "Convite_expiraEm_idx" ON "Convite"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoAutenticacao_token_key" ON "SessaoAutenticacao"("token");

-- CreateIndex
CREATE INDEX "SessaoAutenticacao_userId_idx" ON "SessaoAutenticacao"("userId");

-- CreateIndex
CREATE INDEX "ContaAutenticacao_userId_idx" ON "ContaAutenticacao"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContaAutenticacao_providerId_accountId_key" ON "ContaAutenticacao"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "VerificacaoAutenticacao_identifier_idx" ON "VerificacaoAutenticacao"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "LimiteRequisicao_key_key" ON "LimiteRequisicao"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Unidade_nome_key" ON "Unidade"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_unidadeId_nome_key" ON "Equipe"("unidadeId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_id_unidadeId_key" ON "Equipe"("id", "unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_supervisorId_id_unidadeId_key" ON "Equipe"("supervisorId", "id", "unidadeId");

-- CreateIndex
CREATE INDEX "PeriodoLetivo_unidadeId_inicio_fim_idx" ON "PeriodoLetivo"("unidadeId", "inicio", "fim");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoLetivo_id_unidadeId_key" ON "PeriodoLetivo"("id", "unidadeId");

-- CreateIndex
CREATE INDEX "ConfiguracaoAtendimentoEstagiario_equipeId_periodoLetivoId__idx" ON "ConfiguracaoAtendimentoEstagiario"("equipeId", "periodoLetivoId", "liberado");

-- CreateIndex
CREATE UNIQUE INDEX "Sala_unidadeId_nome_key" ON "Sala"("unidadeId", "nome");

-- CreateIndex
CREATE INDEX "HorarioDisponivel_diaSemana_horaInicio_idx" ON "HorarioDisponivel"("diaSemana", "horaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioDisponivel_estagiarioId_diaSemana_horaInicio_key" ON "HorarioDisponivel"("estagiarioId", "diaSemana", "horaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cpf_key" ON "Paciente"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_horarioAtivoId_key" ON "Agendamento"("horarioAtivoId");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_salaAtivaChave_key" ON "Agendamento"("salaAtivaChave");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_pacienteAtivoId_key" ON "Agendamento"("pacienteAtivoId");

-- CreateIndex
CREATE INDEX "Agendamento_unidadeId_status_idx" ON "Agendamento"("unidadeId", "status");

-- CreateIndex
CREATE INDEX "Agendamento_estagiarioId_status_idx" ON "Agendamento"("estagiarioId", "status");

-- CreateIndex
CREATE INDEX "Agendamento_status_prazoConfirmacao_idx" ON "Agendamento"("status", "prazoConfirmacao");

-- CreateIndex
CREATE INDEX "Agendamento_pacienteId_idx" ON "Agendamento"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_agendamentoId_data_key" ON "Sessao"("agendamentoId", "data");

-- CreateIndex
CREATE INDEX "EventoAgendamento_agendamentoId_criadoEm_idx" ON "EventoAgendamento"("agendamentoId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "ListaEspera_pacienteAtivoId_key" ON "ListaEspera"("pacienteAtivoId");

-- CreateIndex
CREATE INDEX "ListaEspera_equipeId_status_inscritoEm_idx" ON "ListaEspera"("equipeId", "status", "inscritoEm");

-- CreateIndex
CREATE INDEX "ListaEspera_unidadeId_status_idx" ON "ListaEspera"("unidadeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAcesso_tokenHash_key" ON "TokenAcesso"("tokenHash");

-- CreateIndex
CREATE INDEX "TokenAcesso_agendamentoId_idx" ON "TokenAcesso"("agendamentoId");

-- AddForeignKey
ALTER TABLE "UsuarioUnidade" ADD CONSTRAINT "UsuarioUnidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioUnidade" ADD CONSTRAINT "UsuarioUnidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEquipe" ADD CONSTRAINT "UsuarioEquipe_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEquipe" ADD CONSTRAINT "UsuarioEquipe_usuarioId_unidadeId_fkey" FOREIGN KEY ("usuarioId", "unidadeId") REFERENCES "UsuarioUnidade"("usuarioId", "unidadeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEquipe" ADD CONSTRAINT "UsuarioEquipe_equipeId_unidadeId_fkey" FOREIGN KEY ("equipeId", "unidadeId") REFERENCES "Equipe"("id", "unidadeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoAutenticacao" ADD CONSTRAINT "SessaoAutenticacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaAutenticacao" ADD CONSTRAINT "ContaAutenticacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_supervisorId_id_unidadeId_fkey" FOREIGN KEY ("supervisorId", "id", "unidadeId") REFERENCES "UsuarioEquipe"("usuarioId", "equipeId", "unidadeId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PeriodoLetivo" ADD CONSTRAINT "PeriodoLetivo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAtendimentoEstagiario" ADD CONSTRAINT "ConfiguracaoAtendimentoEstagiario_estagiarioId_fkey" FOREIGN KEY ("estagiarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAtendimentoEstagiario" ADD CONSTRAINT "ConfiguracaoAtendimentoEstagiario_equipeId_unidadeId_fkey" FOREIGN KEY ("equipeId", "unidadeId") REFERENCES "Equipe"("id", "unidadeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAtendimentoEstagiario" ADD CONSTRAINT "ConfiguracaoAtendimentoEstagiario_estagiarioId_equipeId_un_fkey" FOREIGN KEY ("estagiarioId", "equipeId", "unidadeId") REFERENCES "UsuarioEquipe"("usuarioId", "equipeId", "unidadeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAtendimentoEstagiario" ADD CONSTRAINT "ConfiguracaoAtendimentoEstagiario_periodoLetivoId_unidadeI_fkey" FOREIGN KEY ("periodoLetivoId", "unidadeId") REFERENCES "PeriodoLetivo"("id", "unidadeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioDisponivel" ADD CONSTRAINT "HorarioDisponivel_estagiarioId_fkey" FOREIGN KEY ("estagiarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_horarioDisponivelId_fkey" FOREIGN KEY ("horarioDisponivelId") REFERENCES "HorarioDisponivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_horarioAtivoId_fkey" FOREIGN KEY ("horarioAtivoId") REFERENCES "HorarioDisponivel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_estagiarioId_fkey" FOREIGN KEY ("estagiarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_pacienteAtivoId_fkey" FOREIGN KEY ("pacienteAtivoId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAgendamento" ADD CONSTRAINT "EventoAgendamento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAgendamento" ADD CONSTRAINT "EventoAgendamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_pacienteAtivoId_fkey" FOREIGN KEY ("pacienteAtivoId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenAcesso" ADD CONSTRAINT "TokenAcesso_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
