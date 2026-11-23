"use server";

import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import {
  CAMINHOS_DAS_BUSCAS_SALVAS,
  gravarBuscaSalva,
  telaComBuscaSalvaSchema,
  textoDaBuscaSchema,
  type TelaComBuscaSalva,
} from "@/lib/url/busca-salva";
import { perfisDaRota } from "./menu";

const entradaSchema = z.object({
  tela: telaComBuscaSalvaSchema,
  texto: textoDaBuscaSchema,
  contexto: z.cuid2().optional(),
});

export async function salvarBusca(tela: TelaComBuscaSalva, texto: string, contexto?: string): Promise<void> {
  const entrada = entradaSchema.safeParse({ tela, texto, contexto });
  if (!entrada.success) return;

  const autor = await exigirUsuario(perfisDaRota(CAMINHOS_DAS_BUSCAS_SALVAS[entrada.data.tela]));
  await gravarBuscaSalva(entrada.data.tela, autor, entrada.data.texto, entrada.data.contexto);
}
