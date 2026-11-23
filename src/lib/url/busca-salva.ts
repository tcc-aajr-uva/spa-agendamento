import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import type { ContextoAutorizacao } from "@/lib/auth/sessao";

export const telaComBuscaSalvaSchema = z.enum(["usuarios", "solicitacoes", "estagiarios-equipe"]);

export type TelaComBuscaSalva = z.infer<typeof telaComBuscaSalvaSchema>;

export const CAMINHOS_DAS_BUSCAS_SALVAS: Record<TelaComBuscaSalva, string> = {
  usuarios: "/cadastros/usuarios",
  solicitacoes: "/cadastros/solicitacoes",
  "estagiarios-equipe": "/cadastros/equipes",
};

const DURACAO_DA_BUSCA_SEGUNDOS = 30 * 60;

export const textoDaBuscaSchema = z.string().trim().max(120);

const buscaSalvaSchema = z.object({
  usuarioId: z.string(),
  contexto: z.string().optional(),
  texto: textoDaBuscaSchema,
});

function nomeDoCookie(tela: TelaComBuscaSalva): string {
  return `busca-${tela}`;
}

export async function lerBuscaSalva(
  tela: TelaComBuscaSalva,
  autor: ContextoAutorizacao,
  contexto?: string,
): Promise<string> {
  const valor = (await cookies()).get(nomeDoCookie(tela))?.value;
  if (!valor) return "";

  try {
    const busca = buscaSalvaSchema.safeParse(JSON.parse(Buffer.from(valor, "base64url").toString("utf8")));
    if (!busca.success || busca.data.usuarioId !== autor.id || busca.data.contexto !== contexto) return "";
    return busca.data.texto;
  } catch {
    return "";
  }
}

export async function gravarBuscaSalva(
  tela: TelaComBuscaSalva,
  autor: ContextoAutorizacao,
  texto: string,
  contexto?: string,
): Promise<void> {
  const valor = texto
    ? Buffer.from(JSON.stringify({ usuarioId: autor.id, contexto, texto }), "utf8").toString("base64url")
    : "";

  (await cookies()).set(nomeDoCookie(tela), valor, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: CAMINHOS_DAS_BUSCAS_SALVAS[tela],
    maxAge: texto ? DURACAO_DA_BUSCA_SEGUNDOS : 0,
  });
}
