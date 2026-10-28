"use server";

import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { exigirUsuario } from "@/lib/auth/permissao";
import { ErroDeRegra } from "@/lib/erros";
import { chamarDaLista } from "@/lib/lista-espera/chamar-da-lista";
import { removerDaLista } from "@/lib/lista-espera/remover-da-lista";
import { executarAcao, texto, type EstadoAcao } from "../acao";
import { formatarData } from "../formatar";
import { perfisDaRota } from "../menu";

export async function remover(listaEsperaId: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/lista-espera"));
  return executarAcao(async () => {
    await removerDaLista(listaEsperaId, usuario);
    return "Inscrição removida da lista.";
  });
}

export async function chamar(listaEsperaId: string, _estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(perfisDaRota("/lista-espera"));
  const [diaSemana, horaInicio] = texto(formData, "horario").split(":");
  try {
    const criado = await chamarDaLista(listaEsperaId, { diaSemana, horaInicio }, usuario);
    return {
      mensagem: `Agendado: ${DIAS_DA_SEMANA[criado.diaSemana]} às ${formatarHora(criado.horaInicio)}, a partir de ${formatarData(criado.dataInicio)}. Passe ao paciente o código ${criado.codigo} e o link de cancelamento /cancelar?token=${criado.token}. O agendamento nasce pendente: confirme em Pacientes.`,
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}
