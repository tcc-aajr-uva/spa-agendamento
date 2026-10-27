import { z } from "zod";

export const MAIORIDADE = 18;

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (tamanho: number) => {
    const soma = cpf
      .slice(0, tamanho)
      .split("")
      .reduce((total, numero, indice) => total + Number(numero) * (tamanho + 1 - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

export function idadeEm(dataNascimento: Date, referencia: Date): number {
  const idade = referencia.getUTCFullYear() - dataNascimento.getUTCFullYear();
  const fezAniversario =
    referencia.getUTCMonth() > dataNascimento.getUTCMonth() ||
    (referencia.getUTCMonth() === dataNascimento.getUTCMonth() && referencia.getUTCDate() >= dataNascimento.getUTCDate());
  return fezAniversario ? idade : idade - 1;
}

const cpfSchema = z
  .string()
  .transform(somenteDigitos)
  .refine(cpfValido, "CPF inválido.");

export const dadosPacienteSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo."),
    cpf: cpfSchema,
    dataNascimento: z.iso.date("Data de nascimento inválida.").transform((data) => new Date(`${data}T00:00:00Z`)),
    telefone: z
      .string()
      .transform(somenteDigitos)
      .refine((telefone) => telefone.length >= 10 && telefone.length <= 11, "Telefone inválido."),
    email: z.email("E-mail inválido.").trim().toLowerCase(),
    responsavelNome: z.string().trim().optional().transform((valor) => valor || undefined),
    responsavelCpf: z
      .string()
      .optional()
      .transform((valor) => (valor ? somenteDigitos(valor) : undefined))
      .refine((valor) => valor === undefined || cpfValido(valor), "CPF do responsável inválido."),
  })
  .refine((dados) => dados.dataNascimento <= new Date(), {
    message: "Data de nascimento no futuro.",
    path: ["dataNascimento"],
  })
  .refine(
    (dados) =>
      idadeEm(dados.dataNascimento, new Date()) >= MAIORIDADE || (dados.responsavelNome !== undefined && dados.responsavelCpf !== undefined),
    { message: "Menor de idade precisa dos dados do responsável legal.", path: ["responsavelNome"] },
  );

export type DadosPaciente = z.output<typeof dadosPacienteSchema>;
