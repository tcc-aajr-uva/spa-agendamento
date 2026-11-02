import Link from "next/link";
import { exigirUsuario } from "@/lib/auth/autorizacao";
import { PERFIS_QUE_CHAMAM } from "@/lib/lista-espera/inscricao";
import { listarListaEspera } from "@/lib/lista-espera/listar-lista-espera";
import { formatarData } from "../formatar";
import { FormularioAcao } from "../formulario-acao";
import { PaginaModulo } from "../pagina-modulo";
import { Paginacao } from "../paginacao";
import { montarHref, numeroDaPagina, primeiro, TAMANHO_DA_PAGINA } from "../parametros";
import { perfisDaRota } from "../menu";
import { remover } from "./actions";

type Busca = PageProps<"/lista-espera">["searchParams"];

export default function ListaEsperaPage({ searchParams }: PageProps<"/lista-espera">) {
  return (
    <PaginaModulo titulo="Lista de espera" card="#3" pendente="design definitivo, a combinar com o time.">
      <Lista busca={searchParams} />
    </PaginaModulo>
  );
}

async function Lista({ busca }: { busca: Busca }) {
  const usuario = await exigirUsuario(perfisDaRota("/lista-espera"));
  const parametros = await busca;
  const pagina = numeroDaPagina(primeiro(parametros.pagina));
  const { equipes, equipe, inscricoes, total } = await listarListaEspera(usuario, {
    equipeId: primeiro(parametros.equipe),
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
  });

  if (!equipe) return <p>Nenhuma equipe disponível.</p>;
  const podeChamar = PERFIS_QUE_CHAMAM.includes(usuario.perfil);

  return (
    <div className="flex flex-col gap-4">
      {equipes.length > 1 && (
        <nav className="flex flex-wrap gap-3 text-sm">
          {equipes.map((opcao) => (
            <Link key={opcao.id} href={montarHref("/lista-espera", { equipe: opcao.id })} className={opcao.id === equipe.id ? "font-bold" : "underline"}>
              {opcao.unidade.nome} / {opcao.nome}
            </Link>
          ))}
        </nav>
      )}
      <h2 className="font-semibold">
        {equipe.unidade.nome} / {equipe.nome} — {total} aguardando
      </h2>
      {inscricoes.length === 0 ? (
        <p>Lista de espera vazia.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {inscricoes.map((inscricao) => (
            <li key={inscricao.id} className="flex flex-wrap items-center gap-3 rounded border p-2">
              <span className={inscricao.posicao === 1 ? "font-bold" : ""}>
                {inscricao.posicao}º — {inscricao.paciente.nome} — {inscricao.paciente.telefone} — desde {formatarData(inscricao.inscritoEm)}
              </span>
              {podeChamar && (
                <Link className="underline" href={`/lista-espera/${inscricao.id}/chamar`}>
                  {inscricao.posicao === 1 ? "Chamar o 1º da lista" : "Chamar"}
                </Link>
              )}
              <FormularioAcao acao={remover.bind(null, inscricao.id)} rotulo="Remover" confirmacao="Remover este paciente da lista de espera?" />
            </li>
          ))}
        </ol>
      )}
      <Paginacao pagina={pagina} total={total} tamanho={TAMANHO_DA_PAGINA} href={(novaPagina) => montarHref("/lista-espera", { equipe: equipe.id, pagina: novaPagina })} />
    </div>
  );
}
