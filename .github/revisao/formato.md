# Formato do comentário

Comece o arquivo exatamente com `## 🔍 Review`, sem nenhum texto antes.

Use os dados de `.revisao/contexto.md` na linha de resumo, sem mudar o trecho "commit `abc1234`": o workflow lê esse commit para reaproveitar o review em outros PRs. A tabela de contagem aparece sempre, com zeros.

Seção sem conteúdo não aparece, e nunca escreva "nenhum achado encontrado". A única seção sempre publicada é "Não coberto".

Todo achado Blocker, Major ou Minor tem os três campos: Achado, Impacto e Sugestão. Sem os três, ele não entra. Nit é uma linha só.

Numere os achados em ordem de importância: `[1]`, `[2]`, `[3]`. Achado que veio de outro PR leva a origem no título, como `(do PR #18)`.

Em `arquivo:linha`, use a linha do arquivo real, nunca a posição em `.revisao/diff.patch`. Antes de gravar, confirme cada linha com Grep no arquivo.

Se `.revisao/anterior.md` tiver conteúdo, inclua "Desde a passagem anterior", dizendo se cada achado foi resolvido ou persiste. Nesse caso, continue a numeração anterior nos achados novos.

## Modelo

```markdown
## 🔍 Review

`branch` · commit `abc1234` · passagem 1 · 3 arquivos, +40/−12

| 🔴 blocker | 🟠 major | 🟡 minor | 🔵 nit |
| --- | --- | --- | --- |
| 1 | 0 | 2 | 1 |

**Veredito:** 🔴 Precisa de ajustes

### 📋 O que muda

Em linguagem simples, o que o PR entrega para quem usa o sistema.

### 🧩 Achados

#### 🔴 Blocker

**[1] `src/app/(private)/pacientes/actions.ts:42` — Falta conferir o escopo**

- **Achado:** o que está errado e quando acontece.
- **Impacto:** o que isso causa para o paciente ou para o sistema.
- **Sugestão:** o que mudar, com um trecho curto de código quando ajudar.

#### 🟠 Major

#### 🟡 Minor

#### 🔵 Nit

- `arquivo.ts:10` — uma linha só.

### ⚠️ Afeta outras tarefas

- `src/lib/arquivo.ts:10` — o que mudou, de qual tarefa ou card veio e quem deve conferir.

### 🤔 Vale um olhar

Suspeitas não comprovadas, marcadas como tal.

### 🔁 Desde a passagem anterior

- ✅ [1] resolvido
- ❌ [2] persiste

### ♻️ Reaproveitado de outros PRs

- PR #18 (commit `abc1234`): já revisado, sem pendências.
- PR #19 (commit `def5678`): 🟡 Minor ainda presente em `arquivo.ts:10`, em uma linha.

### 🧭 Não coberto

Build e lint não foram executados. Liste também os arquivos que não foram lidos. Se houve reaproveitamento, diga que os commits já revisados não foram relidos.
```

## Veredito

Use exatamente um destes:

- `✅ Pronto para aprovar`: sem blocker, major ou minor.
- `🟡 Aprovar com ressalvas`: só minor, sem blocker ou major.
- `🔴 Precisa de ajustes`: pelo menos um blocker ou major.

Nit, "Afeta outras tarefas" e "Reaproveitado de outros PRs" não mudam o veredito.

O veredito é uma orientação. Quem aprova e faz o merge é uma pessoa do grupo.
