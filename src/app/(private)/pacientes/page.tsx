import Link from "next/link";
import { filtroDosAtendimentos } from "@/lib/atendimento/acesso";
import { exigirUsuario, filtroDeUnidade } from "@/lib/auth/permissao";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { DIAS_DA_SEMANA, filtroAgendamentoAtivo, formatarHora, pendenteVencendo } from "@/lib/agendamento/regras";
import { prisma } from "@/lib/prisma";
import { formatarDataHora } from "../formatar";
import { PaginaModulo } from "../pagina-modulo";
import { Paginacao } from "../paginacao";
import { montarHref, numeroDaPagina, primeiro, TAMANHO_DA_PAGINA } from "../parametros";
import { perfisDaRota } from "../menu";
import { EncerrarPeriodo } from "./encerrar-periodo";

type Busca = PageProps<"/pacientes">["searchParams"];

export default function PacientesPage({ searchParams }: PageProps<"/pacientes">) {
  return (
    <PaginaModulo titulo="Pacientes" card="#3" pendente="design definitivo, a combinar com o time.">
      <Pacientes busca={searchParams} />
    </PaginaModulo>
  );
}

async function Pacientes({ busca }: { busca: Busca }) {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  const parametros = await busca;
  const pagina = numeroDaPagina(primeiro(parametros.pagina));
  const equipeId = primeiro(parametros.equipe) || undefined;
  const estagiarioId = primeiro(parametros.estagiario) || undefined;
  const agora = new Date();

  const where = { ...filtroDosAtendimentos(usuario, { equipeId, estagiarioId }), ...filtroAgendamentoAtivo(agora) };
  const [agendamentos, total] = await Promise.all([
    prisma.agendamento.findMany({
      where,
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * TAMANHO_DA_PAGINA,
      take: TAMANHO_DA_PAGINA,
      select: {
        id: true,
        diaSemana: true,
        horaInicio: true,
        status: true,
        prazoConfirmacao: true,
        paciente: { select: { nome: true, telefone: true } },
        estagiario: { select: { nome: true } },
        sala: { select: { nome: true } },
      },
    }),
    prisma.agendamento.count({ where }),
  ]);

  const veEquipe = usuario.perfil !== "ESTAGIARIO";
  const href = (novaPagina: number) => montarHref("/pacientes", { equipe: equipeId, estagiario: estagiarioId, pagina: novaPagina });

  return (
    <div className="flex flex-col gap-4">
      <EncerrarPeriodo usuario={usuario} />
      {veEquipe && <Filtros usuario={usuario} equipeId={equipeId} estagiarioId={estagiarioId} />}
      {agendamentos.length === 0 ? (
        <p>Nenhum paciente ativo.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {agendamentos.map((agendamento) => (
            <li key={agendamento.id} className="rounded border p-2">
              <Link className="underline" href={`/pacientes/${agendamento.id}`}>
                {agendamento.paciente.nome}
              </Link>{" "}
              — {agendamento.paciente.telefone} — {DIAS_DA_SEMANA[agendamento.diaSemana]} {formatarHora(agendamento.horaInicio)} —{" "}
              {agendamento.sala.nome} — {agendamento.status}
              {veEquipe && ` — ${agendamento.estagiario.nome}`}
              {agendamento.status === "PENDENTE" && (
                <span className={pendenteVencendo(agendamento, agora) ? "font-semibold text-amber-500" : ""}>
                  {" "}
                  (confirmar até {formatarDataHora(agendamento.prazoConfirmacao)})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Paginacao pagina={pagina} total={total} tamanho={TAMANHO_DA_PAGINA} href={href} />
    </div>
  );
}

async function Filtros({ usuario, equipeId, estagiarioId }: { usuario: UsuarioAtual; equipeId?: string; estagiarioId?: string }) {
  const escopo = filtroDeUnidade(usuario);
  const [equipes, estagiarios] = await Promise.all([
    prisma.equipe.findMany({
      where: { ...escopo, ativa: true },
      orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
      select: { id: true, nome: true, unidade: { select: { nome: true } } },
    }),
    prisma.usuario.findMany({
      where: { ...escopo, perfil: "ESTAGIARIO", ativo: true, ...(equipeId ? { equipeId } : {}) },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <form method="get" className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Equipe
        <select name="equipe" defaultValue={equipeId ?? ""} className="rounded border bg-transparent px-2 py-1">
          <option value="">Todas</option>
          {equipes.map((equipe) => (
            <option key={equipe.id} value={equipe.id}>
              {equipe.unidade.nome} / {equipe.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Estagiário
        <select name="estagiario" defaultValue={estagiarioId ?? ""} className="rounded border bg-transparent px-2 py-1">
          <option value="">Todos</option>
          {estagiarios.map((estagiario) => (
            <option key={estagiario.id} value={estagiario.id}>
              {estagiario.nome}
            </option>
          ))}
        </select>
      </label>
      <button className="rounded border px-3 py-1">Filtrar</button>
    </form>
  );
}
