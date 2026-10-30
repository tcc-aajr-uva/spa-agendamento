# Formato do comentário

Comece o arquivo exatamente com `## 🔍 Review`, sem nenhum texto antes.

Use os dados de `.revisao/contexto.md` na linha de resumo. A tabela de contagem aparece sempre, com zeros.

Seção sem conteúdo não aparece, e nunca escreva "nenhum achado encontrado". A única seção sempre publicada é "Não coberto".

Todo achado Blocker, Major ou Minor tem os três campos: Achado, Impacto e Sugestão. Sem os três, ele não entra. Nit é uma linha só.

Numere os achados em ordem de importância: `[1]`, `[2]`, `[3]`.

Em `arquivo:linha`, use a linha do arquivo real, nunca a posição em `.revisao/diff.patch`. Confira abrindo o arquivo.

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

### 🤔 Vale um olhar

Suspeitas não comprovadas, marcadas como tal.

### 🔁 Desde a passagem anterior

- ✅ [1] resolvido
- ❌ [2] persiste

### 🧭 Não coberto

Build e lint não foram executados. Liste também os arquivos que não foram lidos.
```

## Veredito

Use exatamente um destes:

- `✅ Pronto para aprovar`: sem blocker, major ou minor.
- `🟡 Aprovar com ressalvas`: só minor, sem blocker ou major.
- `🔴 Precisa de ajustes`: pelo menos um blocker ou major.

Nit não muda o veredito.

O veredito é uma orientação. Quem aprova e faz o merge é uma pessoa do grupo.
