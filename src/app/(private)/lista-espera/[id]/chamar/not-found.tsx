import { EstadoVazio } from "../../../cartao";
import { LinkVoltar } from "../../../link-voltar";

export default function InscricaoNaoEncontrada() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <LinkVoltar href="/lista-espera">Voltar para a lista de espera</LinkVoltar>
      <EstadoVazio>Inscrição não encontrada.</EstadoVazio>
    </section>
  );
}
