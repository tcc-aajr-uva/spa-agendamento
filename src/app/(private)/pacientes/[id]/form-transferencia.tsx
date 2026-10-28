import type { StatusAgendamento } from "@/generated/prisma/client";
import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { listarHorariosParaTransferencia } from "@/lib/atendimento/transferir";
import type { UsuarioAtual } from "@/lib/auth/usuario-atual";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { FormularioAcao } from "../../formulario-acao";
import { transferir } from "./actions-transferencia";

type Props = {
  agendamentoId: string;
  status: StatusAgendamento;
  usuario: UsuarioAtual;
};

export async function FormTransferencia({ agendamentoId, status, usuario }: Props) {
  if (status !== "CONFIRMADO" || !PERFIS_DA_SECRETARIA.includes(usuario.perfil)) return null;

  const horarios = await listarHorariosParaTransferencia(agendamentoId, usuario);
  if (horarios.length === 0) return <p className="text-sm">Nenhum outro estagiário da equipe tem horário livre para receber o caso.</p>;

  return (
    <FormularioAcao acao={transferir.bind(null, agendamentoId)} rotulo="Transferir caso" confirmacao="Transferir o caso para o estagiário escolhido?">
      <label className="flex flex-col gap-1 text-sm">
        Novo estagiário e horário
        <select name="horarioDisponivelId" required className="rounded border bg-transparent px-2 py-1">
          {horarios.map((horario) => (
            <option key={horario.id} value={horario.id}>
              {horario.estagiarioNome} — {DIAS_DA_SEMANA[horario.diaSemana]} às {formatarHora(horario.horaInicio)}
            </option>
          ))}
        </select>
      </label>
    </FormularioAcao>
  );
}
