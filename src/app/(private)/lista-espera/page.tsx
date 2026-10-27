import { exigirUsuario, filtroDeUnidade } from "@/lib/auth/permissao";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function ListaEsperaPage() {
  return (
    <PaginaModulo
      titulo="Lista de espera"
      card="#3"
      pendente="paginação e ação chamar o 1º da lista (criarAgendamento com listaEsperaId)."
    >
      <Lista />
    </PaginaModulo>
  );
}

async function Lista() {
  const usuario = await exigirUsuario(perfisDaRota("/lista-espera"));
  const escopo = usuario.perfil === "ESTAGIARIO" ? { equipeId: usuario.equipeId ?? "" } : filtroDeUnidade(usuario);
  const inscricoes = await prisma.listaEspera.findMany({
    where: { ...escopo, status: "AGUARDANDO" },
    orderBy: [{ equipeId: "asc" }, { inscritoEm: "asc" }],
    take: 50,
    select: {
      id: true,
      inscritoEm: true,
      equipe: { select: { nome: true, unidade: { select: { nome: true } } } },
      paciente: { select: { nome: true, telefone: true } },
    },
  });

  if (inscricoes.length === 0) return <p>Lista de espera vazia.</p>;

  return (
    <ol className="list-decimal pl-6">
      {inscricoes.map((inscricao) => (
        <li key={inscricao.id}>
          {inscricao.equipe.unidade.nome} / {inscricao.equipe.nome} — {inscricao.paciente.nome} — {inscricao.paciente.telefone} — desde{" "}
          {inscricao.inscritoEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </li>
      ))}
    </ol>
  );
}
