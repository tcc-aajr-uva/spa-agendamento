export const TAMANHO_DA_PAGINA = 20;

export function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function numeroDaPagina(valor: string | undefined): number {
  const pagina = Number(valor);
  return Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
}

export function montarHref(caminho: string, parametros: Record<string, string | number | undefined>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== "") busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}
