import { FormularioLogin } from "./formulario-login";

export default function EntrarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <section className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-sm text-gray-600">Use o e-mail e a senha definidos pelo convite.</p>
        </div>
        <FormularioLogin />
      </section>
    </main>
  );
}
