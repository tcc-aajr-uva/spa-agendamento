import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { contarPeriodoEncerrado } from "@/lib/atendimento/encerrar-periodo";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { Cartao } from "../cartao";
import { FormularioAcao } from "../formulario-acao";
import { encerrar } from "./actions-periodo";

export async function EncerrarPeriodo({ usuario }: { usuario: ContextoAutorizacao }) {
  if (!PERFIS_DA_SECRETARIA.includes(usuario.perfil)) return null;

  const unidades = await contarPeriodoEncerrado(prisma, usuario);
  if (unidades.length === 0) return <p className="text-sm text-muted-foreground">Nenhum atendimento com o período letivo encerrado.</p>;

  return (
    <Cartao titulo="Fim do período letivo">
      {unidades.map((unidade) => (
        <FormularioAcao
          key={unidade.id}
          acao={encerrar.bind(null, unidade.id)}
          rotulo={`Encerrar ${unidade.quantidade} atendimento(s) — ${unidade.nome}`}
          confirmacao={`Encerrar ${unidade.quantidade} atendimento(s) cujo período já terminou em ${unidade.nome}? Os horários e as salas serão liberados.`}
          variante="destructive"
        />
      ))}
    </Cartao>
  );
}
