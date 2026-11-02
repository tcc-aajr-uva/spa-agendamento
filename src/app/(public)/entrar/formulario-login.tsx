"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { signIn } from "@/lib/auth/client";

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type Login = z.infer<typeof loginSchema>;

function mensagemDeLimiteExcedido(segundos: number | null) {
  if (segundos === null) {
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }

  return `Muitas tentativas. Tente novamente em ${segundos} ${segundos === 1 ? "segundo" : "segundos"}.`;
}

export function FormularioLogin() {
  const router = useRouter();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<Login>({
    resolver: zodResolver(loginSchema),
  });

  const entrar = handleSubmit(async ({ email, senha }) => {
    let limiteExcedido = false;
    let segundosParaNovaTentativa: number | null = null;

    const resultado = await signIn.email({
      email,
      password: senha,
      fetchOptions: {
        onError: ({ response }) => {
          if (response.status !== 429) return;

          limiteExcedido = true;
          const retryAfter = Number(response.headers.get("X-Retry-After"));
          if (Number.isInteger(retryAfter) && retryAfter > 0) {
            segundosParaNovaTentativa = retryAfter;
          }
        },
      },
    });

    if (resultado.error) {
      setError("root", {
        message: limiteExcedido
          ? mensagemDeLimiteExcedido(segundosParaNovaTentativa)
          : "E-mail ou senha inválidos.",
      });
      return;
    }

    router.replace("/inicio");
    router.refresh();
  });

  return (
    <form className="space-y-4" onSubmit={entrar}>
      <label className="block space-y-1">
        <span>E-mail</span>
        <input className="w-full rounded border px-3 py-2" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <span className="block text-sm text-red-700">{errors.email.message}</span>}
      </label>

      <label className="block space-y-1">
        <span>Senha</span>
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          autoComplete="current-password"
          {...register("senha")}
        />
        {errors.senha && <span className="block text-sm text-red-700">{errors.senha.message}</span>}
      </label>

      {errors.root && <p className="text-sm text-red-700">{errors.root.message}</p>}

      <button className="w-full rounded border px-3 py-2" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
