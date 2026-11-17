"use client";

import { Loader2Icon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth/client";
import { rotaInicialDoPerfil } from "@/lib/auth/rota-inicial";

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

    router.replace(rotaInicialDoPerfil(resultado.data.user.perfil));
    router.refresh();
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={entrar} noValidate>
      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
        <Input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field data-invalid={Boolean(errors.senha)}>
        <FieldLabel htmlFor="login-senha">Senha</FieldLabel>
        <Input id="login-senha" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.senha)} {...register("senha")} />
        <FieldError errors={[errors.senha]} />
      </Field>

      {errors.root && (
        <Alert variant="destructive" aria-live="polite">
          <AlertDescription className="text-destructive">{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <Button size="lg" className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting && <Loader2Icon data-icon="inline-start" aria-hidden className="size-4 animate-spin" />}
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
