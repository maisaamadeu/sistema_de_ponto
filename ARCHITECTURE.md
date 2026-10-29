# Arquitetura — Ponto Fácil

## Objetivo

Aplicação web para controle de ponto (entrada, intervalo, retorno e saída), com
persistência local imediata e caminho claro para sincronização remota futura.

Esta etapa estabelece a **base estrutural**: stack, módulos, rotas vazias e
contratos de repositório. Autenticação, cálculos de jornada e interfaces
completas ficam para etapas seguintes.

## Stack

| Camada                       | Tecnologia                           |
| ---------------------------- | ------------------------------------ |
| UI                           | React 19 + TypeScript + Vite         |
| Estilo                       | Tailwind CSS v4 + shadcn/ui + Lucide |
| Rotas                        | React Router                         |
| Formulários (preparado)      | React Hook Form + Zod                |
| Datas (preparado)            | date-fns                             |
| Persistência local           | Dexie.js (IndexedDB)                 |
| Persistência remota (futuro) | Firestore — apenas reservado         |
| Testes                       | Vitest + Testing Library             |
| Lint / format                | Oxlint + Prettier                    |

## Organização modular

```text
src/
  app/                 # bootstrap, providers e roteamento
  domain/              # entidades, erros e portas (interfaces)
  infrastructure/      # adapters (Dexie agora; Firestore depois) e DI
  features/            # telas por capacidade (dashboard, histórico, settings)
  components/          # UI compartilhada (layout + shadcn/ui)
  lib/                 # utilitários puros
  hooks/               # hooks compartilhados
  test/                # setup de testes
```

### Responsabilidades

- **domain**: regras e contratos. Não importa React, Dexie nem Firebase.
- **infrastructure**: implementa portas do domínio. Troca de backend acontece aqui.
- **features**: orquestra UI e casos de uso de uma capacidade.
- **app**: composition root da UI (providers + router).
- **components**: peças visuais reutilizáveis, sem regra de negócio.

## Domínio de jornada e cálculo

Entidades em `src/domain/entities`:

- `UserProfile`, `WorkSchedule` (múltiplos períodos), `TimeEntry`,
  `WorkDay`, `DayOverride`, `UserPreferences`

Motor puro em `src/domain/calculation` (sem React/persistência):

- minutos inteiros, sessões com intervalo e virada de dia
- classificação (`complete`, `incomplete`, `no_records`, `rest`, `day_off`,
  `vacation`, `holiday`, `excused`, `confirmed_absence`)
- dias sem registro **não** geram débito automático
- `expectedMinutes` congelado em dias já registrados (`expectedFrozen`)
- acumuladores de crédito, débito e saldo líquido (mês / geral)

## Portas e adapters

As features e o domínio dependem apenas de interfaces:

- `UserProfileRepository`
- `UserPreferencesRepository`
- `WorkScheduleRepository`
- `TimeEntryRepository`
- `WorkDayRepository`
- `DayOverrideRepository`

Implementações locais (Dexie / IndexedDB, schema v2):

- `DexieUserProfileRepository`
- `DexieUserPreferencesRepository`
- `DexieWorkScheduleRepository`
- `DexieTimeEntryRepository` (CRUD + rematerialização transacional do `WorkDay`)
- `DexieWorkDayRepository`
- `DexieDayOverrideRepository`
- `ensureGuestSession()` para uso offline sem login

IDs estáveis (`crypto.randomUUID` / `wd_{userId}_{dateKey}`) preparam sync futura.
Falhas de quota/indisponibilidade viram `StorageQuotaExceededError` /
`StorageUnavailableError` / `PersistenceError`.

Reserva futura:

- `infrastructure/persistence/firestore/` (sem SDK nesta etapa)

O composition root (`infrastructure/di/container.ts`) escolhe os adapters.
Migrar de IndexedDB para Firestore (ou usar ambos) não exige alterar entidades
nem regras de negócio — apenas o binding e, se necessário, mapeamento DTO.

## Onboarding e configurações

- Primeiro acesso (`onboardingCompletedAt` ausente) → `/onboarding`
- Formulário Zod: dias, entrada, intervalo, saída, carga (auto/manual),
  modo segunda–sexta ou personalizado, tema e política de faltas
- Edição em `/configuracoes` **cria nova versão** de `WorkSchedule`
  (`effectiveFrom`); versões antigas permanecem para `getEffectiveOn`
- Preferências (`theme`, `absencePolicy`) atualizam in-place
- Schema IndexedDB v3: `mode`/`weekdays` na escala + `absencePolicy`/
  `onboardingCompletedAt` nas preferências

## Rotas iniciais

| Rota             | Feature       | Estado                                      |
| ---------------- | ------------- | ------------------------------------------- |
| `/onboarding`    | Onboarding    | Jornada inicial (primeiro acesso)           |
| `/`              | Dashboard     | Ponto ao vivo (próximo punch + saldo live)  |
| `/historico`     | Histórico     | Placeholder                                 |
| `/configuracoes` | Configurações | Edição versionada de jornada + preferências |

## Aliases

Importações usam o alias `@/*` → `src/*`, configurado em `tsconfig` e
`vite.config.ts`.

## Decisões

1. **Hexagonal leve**: portas no domínio, adapters na infraestrutura.
2. **Dexie primeiro**: permite modo convidado offline sem backend.
3. **Firestore adiado**: evita acoplar auth/sync antes das regras locais.
4. **Oxlint** (vem do scaffold Vite atual) em vez de ESLint; TypeScript fixado em
   5.9 por compatibilidade com o ecossistema (o scaffold trouxe TS 7 experimental).
5. **Páginas vazias de propósito**: validam navegação e shell sem antecipar UX
   de marcação/cálculo.
6. **Métodos de escrita Dexie ainda lançam `NotImplementedError`** onde a regra
   de negócio não existe; leituras básicas (`listByDate`, `get`, `clear`) já
   exercitam o schema.

## Design system

A fonte de verdade visual é [`DESIGN.md`](./DESIGN.md) (tokens, temas, shell,
componentes compartilhados e anti-padrões). A implementação de UI deve preservar
essa identidade.

## Fora de escopo (base + design system demo)

- Autenticação / contas
- Cálculo real de horas, banco de horas e saldos
- Persistência completa de marcações
- Implementação Firestore / Firebase

## Como validar

```bash
npm run lint
npm run format:check
npm run test
npm run build
```
