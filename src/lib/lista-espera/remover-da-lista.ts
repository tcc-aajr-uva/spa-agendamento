import "server-only";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { executarEmTransacao } from "@/lib/transacao";
import { carregarInscricaoAguardando } from "@/lib/lista-espera/inscricao";

export async function removerDaLista(listaEsperaId: string, usuario: UsuarioAtual): Promise<void> {
  await executarEmTransacao(async (tx) => {
    await carregarInscricaoAguardando(tx, listaEsperaId, usuario);
    await tx.listaEspera.update({
      where: { id: listaEsperaId },
      data: { status: "REMOVIDO", pacienteAtivoId: null },
    });
  });
}
