import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { BYTES_TOKEN, TAMANHO_CODIGO } from "./token-constantes";

const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function gerarToken(): string {
  return randomBytes(BYTES_TOKEN).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenTemFormatoValido(token: string): boolean {
  return FORMATO_TOKEN.test(token);
}

export function gerarCodigo(tamanho = TAMANHO_CODIGO): string {
  return Array.from({ length: tamanho }, () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)]).join("");
}
