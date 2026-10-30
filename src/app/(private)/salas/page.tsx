import { exigirUsuario, filtroDeUnidades } from "@/lib/auth/autorizacao";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";

export default function SalasPage() {
  return (
    <PaginaModulo titulo="Salas" card="#2" pendente="cadastro de salas e ocupação por dia e horário.">
      <Salas />
    </PaginaModulo>
  );
}

async function Salas() {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  const salas = await prisma.sala.findMany({
    where: filtroDeUnidades(usuario),
    orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
    take: 100,
    select: { id: true, nome: true, ativa: true, unidade: { select: { nome: true } } },
  });

  return (
    <ul className="list-disc pl-4">
      {salas.map((sala) => (
        <li key={sala.id}>
          {sala.unidade.nome} — {sala.nome} {sala.ativa ? "" : "(inativa)"}
        </li>
      ))}
    </ul>
  );
}
