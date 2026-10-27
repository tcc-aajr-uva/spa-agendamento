import { exigirUsuario, filtroDeUnidade } from "@/lib/auth/permissao";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function PainelPage() {
  return (
    <PaginaModulo
      titulo="Painel"
      card="#4"
      pendente="ocupação das salas, pendentes perto de vencer (pendenteVencendo) com confirmar/liberar e lista de espera por equipe."
    >
      <Resumo />
    </PaginaModulo>
  );
}

async function Resumo() {
  const usuario = await exigirUsuario(perfisDaRota("/painel"));
  const escopo = filtroDeUnidade(usuario);
  const [porStatus, naLista] = await Promise.all([
    prisma.agendamento.groupBy({ by: ["status"], where: escopo, _count: { _all: true } }),
    prisma.listaEspera.count({ where: { ...escopo, status: "AGUARDANDO" } }),
  ]);

  return (
    <ul className="list-disc pl-4">
      {porStatus.map((linha) => (
        <li key={linha.status}>
          {linha.status}: {linha._count._all}
        </li>
      ))}
      <li>Na lista de espera: {naLista}</li>
    </ul>
  );
}
