import { Cartao } from "../../cartao";

export function CodigoCancelamento({ codigo }: { codigo?: string }) {
  return (
    <Cartao titulo="Código de cancelamento">
      <p className="text-muted-foreground">
        Código: <strong className="font-mono tracking-widest text-foreground">{codigo ?? "não disponível"}</strong>
      </p>
      <p className="text-sm text-muted-foreground">
        O paciente cancela pelo botão “Cancelar agendamento” da página inicial, informando o CPF e este código.
      </p>
    </Cartao>
  );
}
