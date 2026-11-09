type Linha = {
  id: string;
  unidade: string;
  equipe: string;
  total: number;
};

export function ListaEsperaPorEquipe({ linhas }: { linhas: Linha[] }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Lista de espera por equipe</h2>
      {linhas.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma equipe cadastrada.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {linhas.map((linha) => (
            <li key={linha.id} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {linha.unidade} / {linha.equipe}
              </span>
              <span className="min-w-8 rounded-full border px-2 py-0.5 text-center text-sm">{linha.total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}