import type { StatusAgendamento } from "@/generated/prisma/client";
import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { listarHorariosParaTransferencia } from "@/lib/atendimento/transferir";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
import { DIAS_DA_SEMANA, formatarHora } from "@/lib/agendamento/regras";
import { CampoSelect } from "../../campo-select";
import { Cartao } from "../../cartao";
import { FormularioAcao } from "../../formulario-acao";
import { transferir } from "./actions-transferencia";

type Props = {
  agendamentoId: string;
  status: StatusAgendamento;
  usuario: ContextoAutorizacao;
};

export async function FormTransferencia({ agendamentoId, status, usuario }: Props) {
  if (status !== "CONFIRMADO" || !PERFIS_DA_SECRETARIA.includes(usuario.perfil)) return null;

  const horarios = await listarHorariosParaTransferencia(agendamentoId, usuario);

  return (
    <Cartao titulo="Transferir caso">
      {horarios.length === 0 ? (
        <p className="text-muted-foreground">Nenhum outro estagiário da equipe tem horário livre para receber o caso.</p>
      ) : (
        <FormularioAcao
          acao={transferir.bind(null, agendamentoId)}
          rotulo="Transferir caso"
          confirmacao="Transferir o caso para o estagiário escolhido?"
          variante="outline"
          larguraTotal
        >
          <CampoSelect
            id="transferir-horario"
            nome="horarioDisponivelId"
            rotulo="Novo estagiário e horário"
            opcoes={horarios.map((horario) => ({
              value: horario.id,
              label: `${horario.estagiarioNome} — ${DIAS_DA_SEMANA[horario.diaSemana]} às ${formatarHora(horario.horaInicio)}`,
            }))}
            obrigatorio
          />
        </FormularioAcao>
      )}
    </Cartao>
  );
}
