"use server";

import { criarAgendamento } from "@/lib/agendamento/criar-agendamento";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { obterUsuarioAtual } from "@/lib/auth/usuario-atual";
import { ErroDeRegra } from "@/lib/erros";
import { adicionarListaEspera } from "@/lib/lista-espera/adicionar-lista-espera";

export type EstadoInscricao = {
  erro?: string;
  mensagem?: string;
  codigo?: string;
  linkCancelamento?: string;
};

export async function agendar(_estado: EstadoInscricao, formData: FormData): Promise<EstadoInscricao> {
  return tratarErros(async () => {
    const resultado = await criarAgendamento(
      {
        unidadeId: texto(formData, "unidadeId"),
        equipeId: texto(formData, "equipeId"),
        diaSemana: texto(formData, "diaSemana"),
        horaInicio: texto(formData, "horaInicio"),
        paciente: lerPaciente(formData),
      },
      await obterUsuarioAtual(),
    );
    const inicio = resultado.dataInicio.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    return {
      mensagem: `Agendado: ${DIAS_DA_SEMANA[resultado.diaSemana]} às ${formatarHora(resultado.horaInicio)}, a partir de ${inicio}. O estagiário vai ligar para confirmar em até 48 horas.`,
      codigo: resultado.codigo,
      linkCancelamento: `/cancelar?token=${resultado.token}`,
    };
  });
}

export async function entrarNaLista(_estado: EstadoInscricao, formData: FormData): Promise<EstadoInscricao> {
  return tratarErros(async () => {
    const resultado = await adicionarListaEspera(
      {
        unidadeId: texto(formData, "unidadeId"),
        equipeId: texto(formData, "equipeId"),
        paciente: lerPaciente(formData),
      },
      await obterUsuarioAtual(),
    );
    return { mensagem: `Você entrou na lista de espera na posição ${resultado.posicao}.` };
  });
}

async function tratarErros(operacao: () => Promise<EstadoInscricao>): Promise<EstadoInscricao> {
  try {
    return await operacao();
  } catch (erro) {
    if (erro instanceof ErroDeRegra) return { erro: erro.message };
    throw erro;
  }
}

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

function lerPaciente(formData: FormData) {
  return {
    nome: texto(formData, "nome"),
    cpf: texto(formData, "cpf"),
    dataNascimento: texto(formData, "dataNascimento"),
    telefone: texto(formData, "telefone"),
    email: texto(formData, "email"),
    responsavelNome: texto(formData, "responsavelNome") || undefined,
    responsavelCpf: texto(formData, "responsavelCpf") || undefined,
  };
}
