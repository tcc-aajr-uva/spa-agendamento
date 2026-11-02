import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";

const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function gerarToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenTemFormatoValido(token: string): boolean {
  return FORMATO_TOKEN.test(token);
}

export function gerarCodigo(tamanho = 6): string {
  return Array.from({ length: tamanho }, () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)]).join("");
}
