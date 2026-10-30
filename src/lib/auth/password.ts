import { compare, hash, truncates } from "bcryptjs";

const RODADAS_BCRYPT = 12;
export const LIMITE_SENHA_BCRYPT_BYTES = 72;

export function senhaExcedeLimiteBcrypt(senha: string): boolean {
  return truncates(senha);
}

export async function gerarHashDaSenha(senha: string): Promise<string> {
  if (senhaExcedeLimiteBcrypt(senha)) {
    throw new Error(`A senha deve possuir no máximo ${LIMITE_SENHA_BCRYPT_BYTES} bytes.`);
  }

  return hash(senha, RODADAS_BCRYPT);
}

export async function verificarSenha({
  hash: senhaHash,
  password: senha,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (senhaExcedeLimiteBcrypt(senha)) return false;
  return compare(senha, senhaHash);
}
