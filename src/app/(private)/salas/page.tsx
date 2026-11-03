import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { exigirUsuario, filtroDeIdsDasUnidades, filtroDeUnidades } from "@/lib/auth/autorizacao";
import { prisma } from "@/lib/prisma";
import { CampoSelect } from "../campo-select";
import { Cartao, EstadoVazio } from "../cartao";
import { FormularioAcao } from "../formulario-acao";
import { CarregandoLista } from "../carregando-lista";
import { PaginaModulo } from "../pagina-modulo";
import { Paginacao } from "../paginacao";
import { montarHref, numeroDaPagina, primeiro } from "../parametros";
import { perfisDaRota } from "../menu";
import { alterarSituacaoSala, criarSala } from "./actions";
import { diaDaUrl, OcupacaoSalas } from "./ocupacao-salas";

const SALAS_POR_PAGINA = 10;

export default function SalasPage({ searchParams }: PageProps<"/salas">) {
  return (
    <PaginaModulo titulo="Salas" carregando={<CarregandoLista />}>
      <Salas searchParams={searchParams} />
    </PaginaModulo>
  );
}

async function Salas({ searchParams }: { searchParams: PageProps<"/salas">["searchParams"] }) {
  const usuario = await exigirUsuario(perfisDaRota("/salas"));
  const parametros = await searchParams;
  const pagina = numeroDaPagina(primeiro(parametros.pagina));

  const [salas, total, unidades] = await Promise.all([
    prisma.sala.findMany({
      where: filtroDeUnidades(usuario),
      orderBy: [{ unidade: { nome: "asc" } }, { nome: "asc" }],
      skip: (pagina - 1) * SALAS_POR_PAGINA,
      take: SALAS_POR_PAGINA,
      select: { id: true, nome: true, ativa: true, unidade: { select: { nome: true } } },
    }),
    prisma.sala.count({ where: filtroDeUnidades(usuario) }),
    prisma.unidade.findMany({ where: filtroDeIdsDasUnidades(usuario), orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const unidadeOcupacao = escolherUnidade(primeiro(parametros.unidade), unidades);
  const dia = diaDaUrl(primeiro(parametros.dia));
  const link = (mudanca: Record<string, number | string>) =>
    montarHref("/salas", { pagina, dia, unidade: unidadeOcupacao ?? undefined, ...mudanca });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          {salas.length === 0 ? (
            <EstadoVazio>{pagina === 1 ? "Nenhuma sala cadastrada ainda." : "Nenhuma sala nesta página."}</EstadoVazio>
          ) : (
            <ItemGroup className="gap-0 divide-y overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
              {salas.map((sala) => (
                <Item key={sala.id} className="flex-wrap rounded-none [&_[data-slot=alert]]:basis-full">
                  <ItemContent className="basis-full sm:basis-auto">
                    <ItemTitle className="grid grid-cols-[8rem_1fr] text-base font-normal">
                      <span className="truncate">{sala.unidade.nome}</span>
                      <span>{sala.nome}</span>
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions className="contents [&_form]:contents">
                    <Badge variant={sala.ativa ? "default" : "outline"}>{sala.ativa ? "Ativa" : "Inativa"}</Badge>
                    <FormularioAcao acao={alterarSituacaoSala} rotulo={sala.ativa ? "Desativar" : "Ativar"} variante="ghost" tamanho="sm">
                      <input type="hidden" name="salaId" value={sala.id} />
                      <input type="hidden" name="ativar" value={String(!sala.ativa)} />
                    </FormularioAcao>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
          <Paginacao pagina={pagina} total={total} tamanho={SALAS_POR_PAGINA} href={(novaPagina) => link({ pagina: novaPagina })} />
        </div>
        <Cartao titulo="Nova sala">
          <FormularioAcao acao={criarSala} rotulo="Cadastrar sala" larguraTotal>
            {unidades.length === 1 ? (
              <input type="hidden" name="unidadeId" value={unidades[0].id} />
            ) : (
              <CampoSelect
                id="nova-sala-unidade"
                nome="unidadeId"
                rotulo="Unidade"
                opcoes={unidades.map((unidade) => ({ value: unidade.id, label: unidade.nome }))}
                obrigatorio
              />
            )}
            <Field>
              <FieldLabel htmlFor="nova-sala-nome">Nome da sala</FieldLabel>
              <Input id="nova-sala-nome" name="nome" required maxLength={60} placeholder="Sala 14" />
            </Field>
          </FormularioAcao>
        </Cartao>
      </div>
      {unidadeOcupacao && (
        <OcupacaoSalas unidadeId={unidadeOcupacao} dia={dia} unidades={unidades.length > 1 ? unidades : null} link={link} />
      )}
    </div>
  );
}

function escolherUnidade(valor: string | undefined, unidades: { id: string }[]): string | null {
  return unidades.find((unidade) => unidade.id === valor)?.id ?? unidades[0]?.id ?? null;
}
