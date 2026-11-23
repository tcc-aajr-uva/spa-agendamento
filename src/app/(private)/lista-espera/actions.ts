"use server";

import { agendarDaLista } from "@/lib/agendamento/criar-agendamento";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { ErroDeRegra } from "@/lib/erros";
import { designarPaciente } from "@/lib/lista-espera/designar-paciente";
import { PERFIS_QUE_AGENDAM, PERFIS_QUE_DESIGNAM, PERFIS_QUE_REMOVEM } from "@/lib/lista-espera/inscricao";
import { removerDaLista } from "@/lib/lista-espera/remover-da-lista";
import { executarAcao, texto, type EstadoAcao } from "../acao";
import { formatarData } from "../formatar";

export async function remover(listaEsperaId: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(PERFIS_QUE_REMOVEM);
  return executarAcao(async () => {
    await removerDaLista(listaEsperaId, usuario);
    return "Inscrição removida da lista.";
  });
}

export async function designar(_estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(PERFIS_QUE_DESIGNAM);
  return executarAcao(async () => {
    const { posicao } = await designarPaciente(
      {
        equipeId: texto(formData, "equipeId"),
        estagiarioId: texto(formData, "estagiarioId"),
        paciente: {
          nome: texto(formData, "nome"),
          cpf: texto(formData, "cpf"),
          dataNascimento: texto(formData, "dataNascimento"),
          telefone: texto(formData, "telefone"),
          email: texto(formData, "email"),
          responsavelNome: texto(formData, "responsavelNome") || undefined,
          responsavelCpf: texto(formData, "responsavelCpf") || undefined,
        },
      },
      usuario,
    );
    return `Paciente cadastrado na lista de espera do estagiário, na posição ${posicao}.`;
  });
}

export async function agendar(listaEsperaId: string, _estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario(PERFIS_QUE_AGENDAM);
  try {
    const criado = await agendarDaLista(
      { listaEsperaId, diaSemana: texto(formData, "diaSemana"), horaInicio: texto(formData, "horaInicio"), salaId: texto(formData, "salaId") },
      usuario,
    );
    return {
      mensagem: `Agendado: ${DIAS_DA_SEMANA[criado.diaSemana]} às ${formatarHora(criado.horaInicio)}, ${criado.sala}, a partir de ${formatarData(criado.dataInicio)}. O agendamento nasce pendente: confirme com o paciente em até 48 horas em Pacientes.`,
    };
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}
