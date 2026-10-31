import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">SPA UVA</h1>
      <p>Agendamento do Serviço de Psicologia Aplicada.</p>
      <nav className="flex flex-col gap-2 underline">
        <Link href="/agendar">Quero agendar um atendimento</Link>
        <Link href="/entrar">Área interna (entrar)</Link>
      </nav>
    </main>
  );
}
