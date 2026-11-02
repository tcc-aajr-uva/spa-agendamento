export type ParametrosBusca = Record<string, string | string[] | undefined>;

export function criarParametrosBusca(entrada: ParametrosBusca): URLSearchParams {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(entrada)) {
    if (Array.isArray(valor)) valor.forEach((item) => parametros.append(chave, item));
    else if (valor !== undefined) parametros.set(chave, valor);
  }
  return parametros;
}
