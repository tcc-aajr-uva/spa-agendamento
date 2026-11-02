import "server-only";

import { gerarToken, hashToken } from "@/lib/token";

const DURACAO_CONVITE_MS = 24 * 60 * 60 * 1000;

export function gerarDadosConvite(agora: Date) {
  const token = gerarToken();
  return {
    token,
    tokenHash: hashToken(token),
    expiraEm: new Date(agora.getTime() + DURACAO_CONVITE_MS),
  };
}
