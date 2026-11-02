import "server-only";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { executarEmTransacao } from "@/lib/transacao";
import { carregarInscricaoAguardando } from "@/lib/lista-espera/inscricao";

export async function removerDaLista(listaEsperaId: string, usuario: ContextoAutorizacao): Promise<void> {
  await executarEmTransacao(async (tx) => {
    await carregarInscricaoAguardando(tx, listaEsperaId, usuario);
    await tx.listaEspera.update({
      where: { id: listaEsperaId },
      data: { status: "REMOVIDO", pacienteAtivoId: null },
    });
  });
}
