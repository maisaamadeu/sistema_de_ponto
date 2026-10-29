# Ponto Fácil

Controle de ponto para jornada de trabalho (entrada, intervalo, retorno e saída).

## Stack

React, TypeScript, Vite, Tailwind CSS, React Router, shadcn/ui, Lucide, React Hook
Form, Zod, date-fns, Dexie.js e Vitest.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Scripts

| Script                 | Descrição                     |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Servidor de desenvolvimento   |
| `npm run build`        | Typecheck + build de produção |
| `npm run lint`         | Oxlint                        |
| `npm run format`       | Prettier (write)              |
| `npm run format:check` | Prettier (check)              |
| `npm run test`         | Vitest                        |
| `npm run test:watch`   | Vitest em watch               |
| `npm run preview`      | Preview do build              |

## Fluxo inicial

No primeiro acesso o app abre `/onboarding` para definir a jornada (dias,
horários, carga, tema e faltas). Em `/configurações` as edições criam uma
**nova versão** da escala no IndexedDB, preservando o histórico.

## Arquitetura

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) e [DESIGN.md](./DESIGN.md).
