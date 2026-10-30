import { exigirUsuario, filtroDeUnidade } from "@/lib/auth/permissao";
import { prisma } from "@/lib/prisma";
import { PaginaModulo } from "../pagina-modulo";
import { perfisDaRota } from "../menu";
import { BotaoSituacaoSala, FormularioNovaSala } from "./formularios-sala";

export default function SalasPage() {
  return (
    <PaginaModulo titulo="Salas" card="#2" pendente="ocupação por dia e horário.">
      <Salas />
    </PaginaModulo>
  );
}

async function Salas() {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  const [salas, unidades] = await Promise.all([
    prisma.sala.findMany({
      where: filtroDeUnidade(usuario),
      orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
      take: 100,
      select: { id: true, nome: true, ativa: true, unidade: { select: { nome: true } } },
    }),
    // Só a coordenação geral (sem unidade) escolhe a unidade da sala nova.
    usuario.unidadeId === null
      ? prisma.unidade.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } })
      : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {salas.map((sala) => (
          <li key={sala.id} className="flex flex-wrap items-center gap-2">
            <span>
              {sala.unidade.nome} — {sala.nome} {sala.ativa ? "" : "(inativa)"}
            </span>
            <BotaoSituacaoSala salaId={sala.id} nome={sala.nome} ativa={sala.ativa} />
          </li>
        ))}
      </ul>
      <section className="flex max-w-md flex-col gap-2">
        <h2 className="text-lg font-bold">Nova sala</h2>
        <FormularioNovaSala unidades={unidades} />
      </section>
    </div>
  );
}
