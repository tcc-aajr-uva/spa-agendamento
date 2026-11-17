function digitos(valor: string, limite: number): string {
  return valor.replace(/\D/g, "").slice(0, limite);
}

export function formatarCpf(valor: string): string {
  const numeros = digitos(valor, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function formatarTelefone(valor: string): string {
  const numeros = digitos(valor, 11);
  if (numeros.length <= 2) return numeros.length ? `(${numeros}` : "";
  const ddd = numeros.slice(0, 2);
  const resto = numeros.slice(2);
  const corte = numeros.length === 11 ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
