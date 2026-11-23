import type { StatusAgendamento } from "@/generated/prisma/client";
import { PERFIS_DA_SECRETARIA } from "@/lib/atendimento/acesso";
import { listarEstagiariosParaTransferencia } from "@/lib/atendimento/transferir";
import type { ContextoAutorizacao } from "@/lib/auth/sessao";
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

  const estagiarios = await listarEstagiariosParaTransferencia(agendamentoId, usuario);

  return (
    <Cartao titulo="Transferir caso">
      {estagiarios.length === 0 ? (
        <p className="text-muted-foreground">Nenhum outro estagiário da equipe está liberado, com vaga e livre neste dia e horário.</p>
      ) : (
        <FormularioAcao
          acao={transferir.bind(null, agendamentoId)}
          rotulo="Transferir caso"
          confirmacao="Transferir o caso para o estagiário escolhido? O dia, o horário e a sala continuam os mesmos."
          variante="outline"
          larguraTotal
        >
          <CampoSelect
            id="transferir-estagiario"
            nome="estagiarioId"
            rotulo="Novo estagiário (mesmo dia, horário e sala)"
            opcoes={estagiarios.map((estagiario) => ({ value: estagiario.id, label: estagiario.nome }))}
            obrigatorio
          />
        </FormularioAcao>
      )}
    </Cartao>
  );
}
