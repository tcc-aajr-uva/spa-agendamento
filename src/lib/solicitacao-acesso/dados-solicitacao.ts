import { z } from "zod";

import { novoUsuarioSchema } from "@/lib/usuario/dados-usuario";

export const novaSolicitacaoSchema = z.object({
  nome: novoUsuarioSchema.shape.nome,
  email: novoUsuarioSchema.shape.email,
  unidadeId: z.cuid2("Selecione a unidade."),
});

export type NovaSolicitacao = z.input<typeof novaSolicitacaoSchema>;
