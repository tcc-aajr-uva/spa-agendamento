# SPA Agendamento

Sistema de agendamento do Serviço de Psicologia Aplicada (SPA) da Universidade Veiga de Almeida, desenvolvido como projeto de Trabalho de Conclusão de Curso (TCC).

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS

## Executando o projeto

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

A página inicial está localizada em `src/app/(public)/page.tsx`.

## Estrutura de rotas

As páginas públicas devem ser criadas em `src/app/(public)`. Esse grupo deve conter páginas que podem ser acessadas sem autenticação, como a página inicial, o agendamento pelo paciente e o login.

As páginas privadas devem ser criadas em `src/app/(private)`. Esse grupo deve conter páginas que exigem autenticação, como o painel da secretaria, a agenda dos estagiários e o cadastro de supervisores.

Os nomes `(public)` e `(private)` são usados apenas para organizar o projeto e não aparecem nas URLs. O grupo `(private)` não protege as páginas automaticamente; a validação de autenticação será configurada posteriormente.

## Status

Projeto em desenvolvimento.
