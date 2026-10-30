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
    const resultado = await signIn.email({
      email,
      password: senha,
    });

    if (resultado.error) {
      setError("root", {
        message: "E-mail ou senha inválidos.",
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
