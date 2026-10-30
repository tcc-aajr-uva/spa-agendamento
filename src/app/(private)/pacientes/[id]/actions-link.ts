"use server";

import { gerarNovoLinkDeCancelamento } from "@/lib/atendimento/link-cancelamento";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { executarAcao, montarLinkDeCancelamento, type EstadoAcao } from "../../acao";
import { perfisDaRota } from "../../menu";

export async function gerarLink(agendamentoId: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/pacientes"));
  return executarAcao(async () => {
    const { codigo, token } = await gerarNovoLinkDeCancelamento(agendamentoId, usuario);
    const link = await montarLinkDeCancelamento(token);
    return { mensagem: `Envie ao paciente o código ${codigo} e o link ${link} (ele só aparece agora).`, avisarAoSair: true };
  });
}
