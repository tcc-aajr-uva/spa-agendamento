import "server-only";
import { z } from "zod";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { ErroDeRegra } from "@/lib/erros";
import { dadosPacienteSchema } from "@/lib/paciente/dados-paciente";
import { salvarPaciente } from "@/lib/paciente/salvar-paciente";
import { executarEmTransacao, violouUnicidade } from "@/lib/transacao";
import { autorizarAgendamento, carregarUnidadeParaAgendar, garantirPacienteSemVinculoAtivo } from "@/lib/agendamento/autorizacao";
import { liberarPendentesVencidos } from "@/lib/agendamento/liberar-agendamento";

export const inscricaoListaEsperaSchema = z.object({
  unidadeId: z.string().min(1),
  equipeId: z.string().min(1),
  paciente: dadosPacienteSchema,
});

export type InscricaoListaEspera = z.input<typeof inscricaoListaEsperaSchema>;

export type PosicaoNaLista = {
  listaEsperaId: string;
  posicao: number;
};

export async function adicionarListaEspera(
  entrada: InscricaoListaEspera,
  usuario: ContextoAutorizacao | null,
  agora = new Date(),
): Promise<PosicaoNaLista> {
  const dados = inscricaoListaEsperaSchema.safeParse(entrada);
  if (!dados.success) throw new ErroDeRegra("DADOS_INVALIDOS", dados.error.issues[0]?.message ?? "Dados inválidos.");
  const { unidadeId, equipeId, paciente } = dados.data;

  try {
    return await executarEmTransacao(async (tx) => {
      const unidade = await carregarUnidadeParaAgendar(tx, unidadeId, equipeId, agora);
      autorizarAgendamento(unidade, equipeId, usuario);

      await liberarPendentesVencidos(tx, { paciente: { cpf: paciente.cpf } }, agora);
      await garantirPacienteSemVinculoAtivo(tx, paciente.cpf);
      const { id: pacienteId } = await salvarPaciente(tx, paciente);

      const inscricao = await tx.listaEspera.create({
        data: { unidadeId, equipeId, pacienteId, pacienteAtivoId: pacienteId, inscritoEm: agora },
        select: { id: true },
      });
      const posicao = await tx.listaEspera.count({
        where: { equipeId, status: "AGUARDANDO", inscritoEm: { lte: agora } },
      });
      return { listaEsperaId: inscricao.id, posicao };
    });
  } catch (erro) {
    if (violouUnicidade(erro)) {
      throw new ErroDeRegra("PACIENTE_JA_ATIVO", "Este CPF já tem um agendamento ativo ou uma posição na lista de espera.");
    }
    throw erro;
  }
}
