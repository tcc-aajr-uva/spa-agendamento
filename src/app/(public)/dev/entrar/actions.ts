"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { COOKIE_USUARIO_DEV, sessaoDeDesenvolvimentoAtiva } from "@/lib/auth/usuario-atual";
import { ROTA_ENTRAR, ROTA_INICIO } from "@/lib/auth/permissao";

export async function entrarComo(formData: FormData) {
  if (!sessaoDeDesenvolvimentoAtiva()) notFound();
  const usuarioId = String(formData.get("usuarioId") ?? "");
  (await cookies()).set(COOKIE_USUARIO_DEV, usuarioId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(ROTA_INICIO);
}

export async function sair() {
  (await cookies()).delete(COOKIE_USUARIO_DEV);
  redirect(ROTA_ENTRAR);
}
