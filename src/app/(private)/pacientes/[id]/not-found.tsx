import { EstadoVazio } from "../../cartao";
import { LinkVoltar } from "../../link-voltar";

export default function AtendimentoNaoEncontrado() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <LinkVoltar href="/pacientes">Voltar para pacientes</LinkVoltar>
      <EstadoVazio>Atendimento não encontrado.</EstadoVazio>
    </section>
  );
}
