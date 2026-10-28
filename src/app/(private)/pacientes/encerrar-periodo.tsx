import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { contarPeriodoEncerrado } from "@/lib/atendimento/encerrar-periodo";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { prisma } from "@/lib/prisma";
import { FormularioAcao } from "../formulario-acao";
import { encerrar } from "./actions-periodo";

export async function EncerrarPeriodo({ usuario }: { usuario: UsuarioAtual }) {
  if (!PERFIS_DA_SECRETARIA.includes(usuario.perfil)) return null;

  const unidades = await contarPeriodoEncerrado(prisma, usuario);
  if (unidades.length === 0) return <p className="text-sm">Nenhum atendimento com o período letivo encerrado.</p>;

  return (
    <section className="flex flex-col gap-2 rounded border p-3">
      <h2 className="font-semibold">Fim do período letivo</h2>
      {unidades.map((unidade) => (
        <FormularioAcao
          key={unidade.id}
          acao={encerrar.bind(null, unidade.id)}
          rotulo={`Encerrar ${unidade.quantidade} atendimento(s) — ${unidade.nome}`}
          confirmacao={`Encerrar ${unidade.quantidade} atendimento(s) cujo período já terminou em ${unidade.nome}? Os horários e as salas serão liberados.`}
        />
      ))}
    </section>
  );
}
