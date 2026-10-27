import { compare, hash } from "bcryptjs";

const RODADAS_BCRYPT = 12;

export function gerarHashDaSenha(senha: string): Promise<string> {
  return hash(senha, RODADAS_BCRYPT);
}

export function verificarSenha({
  hash: senhaHash,
  password: senha,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  return compare(senha, senhaHash);
}
