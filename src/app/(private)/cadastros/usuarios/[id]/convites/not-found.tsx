import Link from "next/link";

export default function ConvitesUsuarioNaoEncontrado() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Convite indisponível</h1>
      <p>O usuário não existe ou não pertence ao seu escopo de atuação.</p>
      <Link className="underline" href="/cadastros/usuarios">
        Voltar para usuários
      </Link>
    </section>
  );
}
