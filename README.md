# SPA Agendamento

Sistema de agendamento do Serviço de Psicologia Aplicada (SPA) da Universidade Veiga de Almeida, desenvolvido como projeto de Trabalho de Conclusão de Curso (TCC).

## Tecnologias

- Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS
- Prisma 7 com PostgreSQL no Neon (adapter `@prisma/adapter-pg`)
- Zod para validar as entradas no servidor

> Esta versão do Next.js muda várias APIs. Antes de escrever código, leia o `AGENTS.md` e a documentação em `node_modules/next/dist/docs/`.

## Primeiros passos

1. Suba um banco e copie `.env.example` para `.env`:
   - **Local (Docker):** veja [Banco local com Docker](#banco-local-com-docker).
   - **Neon:** crie a sua branch. `DATABASE_URL` é a connection string **com pool** (host com `-pooler`), usada pelo app; `DIRECT_URL` é a **direta**, usada pelo CLI do Prisma.
2. Instale as dependências (o `postinstall` já gera o client do Prisma em `src/generated/prisma`):

   ```bash
   npm install
   ```

3. Crie as tabelas aplicando as migrations de `prisma/migrations` e carregue os dados de teste:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

   Mudou o `schema.prisma`? Gere uma migration nova com nome descritivo (`npx prisma migrate dev --name tabela-sessao`) e leve a pasta gerada no PR. Nunca apague nem edite uma migration que já foi aplicada; em produção as migrations rodam com `npx prisma migrate deploy`.

4. Rode o projeto e entre como qualquer usuário do seed em `/dev/entrar`:

   ```bash
   npm run dev
   ```

O seed é idempotente: pode rodar de novo para restaurar os dados de teste.

## Banco local com Docker

O arquivo `docker/docker-compose.yaml` sobe um PostgreSQL 18 na porta 5432, com os dados guardados num volume do Docker. Precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto, com "Engine running".

1. Na raiz do projeto, suba o banco:

   ```bash
   docker compose -f docker/docker-compose.yaml up -d
   ```

2. No `.env`, use a mesma URL nas duas variáveis (o `@` da senha vai como `%40`):

   ```
   DATABASE_URL=postgresql://postgres:B%40nco123@localhost:5432/spa
   DIRECT_URL=postgresql://postgres:B%40nco123@localhost:5432/spa
   ```

3. Siga os passos 2 a 4 de [Primeiros passos](#primeiros-passos). O `prisma migrate dev` cria o banco `spa` se ele não existir.

Para conectar pelo DBeaver ou outro cliente: host `localhost`, porta `5432`, database `spa`, usuário `postgres`, senha `B@nco123`, sem SSL.

| Comando | O que faz |
| --- | --- |
| `docker compose -f docker/docker-compose.yaml up -d` | liga o banco |
| `docker compose -f docker/docker-compose.yaml stop` | desliga o banco (os dados ficam) |
| `docker compose -f docker/docker-compose.yaml ps` | mostra se está rodando |
| `docker compose -f docker/docker-compose.yaml logs postgres` | log do banco |
| `docker compose -f docker/docker-compose.yaml down -v` | **apaga o banco e os dados**; depois rode `migrate dev` e `db:seed` de novo |

A senha deste arquivo é só para o banco local de desenvolvimento. Nunca use no Neon nem em produção.

## Estrutura

```
prisma/
  schema.prisma          todas as tabelas dos 4 cards
  seed.ts                2 unidades, 2 equipes cada, 3 salas, usuários de todos os perfis, agendamentos e lista de espera
prisma.config.ts         configuração do CLI (DIRECT_URL, seed)
docker/docker-compose.yaml  PostgreSQL local para desenvolvimento
src/app/(public)/        páginas sem login: início, agendar, cancelar, dev/entrar
src/app/(private)/       páginas com login: inicio, cadastros, salas, agenda, reservas, pacientes, lista-espera, painel
src/lib/                 regras e acesso a dados compartilhados (só servidor)
```

Os nomes `(public)` e `(private)` organizam o projeto e não aparecem nas URLs. O grupo `(private)` não protege as páginas sozinho: **toda página, Server Action e Route Handler chama `exigirUsuario()` e confere o escopo com `podeAcessar()`**.

Com Cache Components, qualquer leitura de cookie, banco ou `searchParams` fica dentro de `<Suspense>` (veja `PaginaModulo` em `src/app/(private)/pagina-modulo.tsx`).

## O que já vem pronto (`src/lib`)

| Arquivo | O que faz | Usado por |
| --- | --- | --- |
| `prisma.ts` | instância única do Prisma Client | todos |
| `transacao.ts` | `executarEmTransacao` (Serializable, repete em conflito) e `violouUnicidade` | todos |
| `erros.ts` | `ErroDeRegra` com código; as actions mostram `erro.message` | todos |
| `auth/usuario-atual.ts` | `obterUsuarioAtual()` → `{ id, nome, perfil, unidadeId, equipeId }` ou `null` | todos |
| `auth/permissao.ts` | `exigirUsuario(perfis?)`, `podeAcessar(usuario, escopo)`, `filtroDeUnidade(usuario)` | todos |
| `token.ts` | `gerarToken`, `hashToken` (sha256), `gerarCodigo` | #1 convite, #4 cancelamento |
| `paciente/dados-paciente.ts` | schema Zod da inscrição (CPF, menor exige responsável) | #4 |
| `agendamento/regras.ts` | prazo de 48 h, 3 faltas, `filtroAgendamentoAtivo`, `estaOcupando`, `pendenteVencendo`, `horarioNaGrade`, datas | #2, #3, #4 |
| `agendamento/horarios-livres.ts` | `listarHorariosLivres(unidadeId, equipeId)` → só dia e hora, nunca o estagiário | #4 (o #2 otimiza) |
| `agendamento/criar-agendamento.ts` | `criarAgendamento(entrada, usuario)` em transação | #2, #3, #4 |
| `agendamento/liberar-agendamento.ts` | `liberarAgendamento(id, { status, motivo, usuarioId })`: a função única que libera horário e sala | #2, #3, #4 |
| `lista-espera/adicionar-lista-espera.ts` | `adicionarListaEspera(entrada, usuario)` | #4, #3 |

### Login provisório

O login real (e-mail, senha, convite) é do card #1. Até lá, `obterUsuarioAtual()` lê o cookie `dev_usuario` gravado por `/dev/entrar`, **só com `NODE_ENV=development`**. Em produção ele devolve `null` e `/dev/entrar` responde 404. O #1 troca só o miolo de `obterUsuarioAtual()`; quem chama não muda.

### Concorrência

Cada agendamento ativo preenche três colunas com índice único, e liberar zera as três:

- `horarioAtivoId`: um paciente por horário do estagiário;
- `salaAtivaChave` (`salaId:diaSemana:horaInicio`): uma sala por horário;
- `pacienteAtivoId`: um agendamento ativo por paciente (a lista de espera tem a mesma coluna).

Dois cliques ao mesmo tempo no mesmo horário: um grava e o outro recebe `HORARIO_OCUPADO`. As funções rodam em transação `Serializable`.

### Pendente vencido

Não existe tarefa agendada. Quem lê usa `filtroAgendamentoAtivo(agora)` ou `estaOcupando()`, para os quais o pendente com mais de 48 h não ocupa. Quem grava chama `liberarPendentesVencidos()` dentro da transação, como `criarAgendamento` já faz.

## Revisão automática de PR

O workflow `.github/workflows/revisao-pr.yml` usa o Claude para revisar cada PR e publica um comentário com contagem de achados, veredito, o que muda e o que não foi coberto.

- Roda ao abrir, reabrir ou tirar o PR de rascunho, se o workflow existir na branch do PR ou na base dele.
- Para pedir uma revisão em qualquer PR, comente `/revisar` ou `/review`. O bot reage com 👀 e responde em cerca de 1 minuto. Esse comando usa o workflow e as regras da `main`, então funciona mesmo em branches antigas.
- O que o bot olha fica em `.github/revisao/regras.md`, e o modelo do comentário em `.github/revisao/formato.md`.
- O veredito é uma orientação: não bloqueia o merge e não substitui a revisão de outra pessoa, o `npm run lint` nem o `npm run build`.
- Precisa do secret `CLAUDE_CODE_OAUTH_TOKEN` no repositório, gerado com `claude setup-token`.

## Regras para mexer no esqueleto

- Tabela de outro card: combine com o dono antes. Campos novos na própria tabela são livres.
- Nunca rode `prisma migrate` ou `db push` apontando para a branch de outra pessoa.
- Rode `npm run lint` e `npm run build` antes de abrir o PR.
