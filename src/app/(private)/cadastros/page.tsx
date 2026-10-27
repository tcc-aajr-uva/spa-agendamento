import { exigirUsuario, filtroDeUnidade } from "@/lib/auth/permissao";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function CadastrosPage() {
  return (
    <PaginaModulo
      titulo="Cadastros"
      card="#1"
      pendente="CRUD de unidades, equipes, período letivo e usuários; convite; liberar estagiário e limite de pacientes."
    >
      <Unidades />
    </PaginaModulo>
  );
}

async function Unidades() {
  const usuario = await exigirUsuario(perfisDaRota("/cadastros"));
  const unidades = await prisma.unidade.findMany({
    where: { id: filtroDeUnidade(usuario).unidadeId },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      agendamentoAberto: true,
      equipes: { orderBy: { nome: "asc" }, select: { id: true, nome: true, supervisor: { select: { nome: true } } } },
      periodos: { orderBy: { inicio: "desc" }, take: 1, select: { inicio: true, fim: true } },
    },
  });

  return (
    <ul className="flex flex-col gap-3">
      {unidades.map((unidade) => (
        <li key={unidade.id}>
          <strong>{unidade.nome}</strong> — agendamento {unidade.agendamentoAberto ? "aberto" : "fechado"}
          {unidade.periodos[0] &&
            ` — período ${unidade.periodos[0].inicio.toLocaleDateString("pt-BR", { timeZone: "UTC" })} a ${unidade.periodos[0].fim.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`}
          <ul className="ml-4 list-disc">
            {unidade.equipes.map((equipe) => (
              <li key={equipe.id}>
                {equipe.nome} — supervisor: {equipe.supervisor?.nome ?? "sem supervisor"}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
