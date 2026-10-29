# DESIGN.md — Ponto Fácil

Fonte de verdade visual do produto. Toda tela, componente e token deve seguir este documento.

## 1. Identidade visual

**Produto:** Ponto Fácil — controle de jornada (entrada, intervalo, retorno, saída).

**Posicionamento visual:** SaaS minimalista de trabalho diário. Aparência de produto profissional, alta legibilidade, pouca poluição. Sem dashboard genérico, sem gradientes decorativos, sem ícones em quadrados coloridos.

**Direção (taste-skill v2 / app):** estilo `accent-ladder` + shell `open plane`.

**Face do produto (escolhida):**

1. Escala de matiz própria do Ponto Fácil — **teal** (`#0F766E`), não raspberry/violeta da biblioteca.
2. Assinatura: **fita de marcações** — sequência de horários tabulares da jornada, lida da esquerda para a direita.
3. Solo levemente tingido pelo teal mais pálido, para o canvas e as áreas soft parecerem da mesma família.

**Inspiração (awesome-design-md, adaptada — não cópia):**

- Cal.com: CTAs escuros, whitespace, software de tempo sem ruído.
- IBM Carbon: tokens semânticos claros, superfícies planas, cor só onde comunica.

**Ideia:** o cartão de ponto vira a interface — números tabulares, regras finas, um único matiz para “em jornada”.

## 2. Princípios

1. Cor vai para **dados, status e a ação primária** — não para o chrome.
2. Orçamento de cor ≈ **3–10%** da tela; o resto é tipografia e alinhamento.
3. Separação por **1px hairline** ou um degrau de tom. Sem sombra em repouso.
4. Um único raio dominante em cards (`8px`) e controles (`6px`).
5. Densidade **sparse**: um gap (`24px`) e um pad (`24px`) no desktop; `16px` no mobile.
6. Tipografia **DM Sans**; números sempre com `tabular-nums`.
7. Sentence case. Sem caixa alta rastreada em labels.

## 3. Tokens semânticos

### 3.1 Cores — tema claro

| Token          | Valor     | Uso                                        |
| -------------- | --------- | ------------------------------------------ |
| `ground`       | `#F7FAF9` | Fundo da app / sidebar                     |
| `surface`      | `#FFFFFF` | Cards, painéis, popovers                   |
| `raised`       | `#EEF4F2` | Hover de linhas, trilhos                   |
| `border`       | `#D9E3DF` | Bordas estruturais                         |
| `rule`         | `#E8EFEC` | Divisores internos                         |
| `control`      | `#C5D4CF` | Contorno de controles                      |
| `text`         | `#10211D` | Texto principal                            |
| `muted`        | `#5B6B66` | Labels, metadados                          |
| `accent`       | `#0F766E` | Marcas fortes, ícone ativo, CTA preenchido |
| `accent-soft`  | `#F0FDFA` | Nav ativa, pills, fundo soft               |
| `accent-track` | `#CCFBF1` | Trilhos / progresso                        |
| `accent-ink`   | `#115E59` | Texto sobre soft                           |
| `positive`     | `#247B50` | Concluído / saldo positivo                 |
| `negative`     | `#C4242A` | Erro / atraso crítico                      |
| `warning`      | `#92400E` | Atenção                                    |
| `focus`        | `#0F766E` | Anel de foco                               |

### 3.2 Cores — tema escuro

| Token          | Valor     | Uso                            |
| -------------- | --------- | ------------------------------ |
| `ground`       | `#0C1211` | Fundo                          |
| `surface`      | `#151C1A` | Cards                          |
| `raised`       | `#1C2623` | Hover                          |
| `border`       | `#2A3733` | Bordas                         |
| `rule`         | `#1F2A27` | Divisores                      |
| `control`      | `#3A4A45` | Controles                      |
| `text`         | `#ECF4F1` | Texto                          |
| `muted`        | `#9AADA6` | Labels                         |
| `accent`       | `#2DD4BF` | Marcas (mais claras no escuro) |
| `accent-soft`  | `#12352F` | Áreas soft                     |
| `accent-track` | `#1A4A42` | Trilhos                        |
| `accent-ink`   | `#99F6E4` | Texto soft                     |
| `positive`     | `#4ADE80` | Sucesso                        |
| `negative`     | `#F87171` | Erro                           |
| `warning`      | `#FBBF24` | Atenção                        |
| `focus`        | `#2DD4BF` | Foco                           |

### 3.3 Tipografia

Família: **DM Sans** (`400`, `500`, `600`, `700`). Fallback: `system-ui, sans-serif`.

| Token        | Tamanho   | Peso      | Uso               |
| ------------ | --------- | --------- | ----------------- |
| `fs-title`   | `28–32px` | `700`     | Título da tela    |
| `fs-section` | `18px`    | `600`     | Seções            |
| `fs-kpi`     | `24px`    | `500–600` | Valores de resumo |
| `fs-body`    | `14px`    | `400–500` | Corpo / nav       |
| `fs-small`   | `12–13px` | `400–500` | Labels, captions  |
| `fs-clock`   | `20–28px` | `500`     | Horários na fita  |

Números em KPIs, tabelas e campos de horário: `font-variant-numeric: tabular-nums`.

### 3.4 Espaçamento e raios

| Token               | Valor                              |
| ------------------- | ---------------------------------- |
| `gap`               | `24px` (desktop) / `16px` (mobile) |
| `pad`               | `24px` / `16px`                    |
| `sidebar-width`     | `240px`                            |
| `row-height`        | `48px`                             |
| `control-height`    | `36px`                             |
| `radius-card`       | `8px`                              |
| `radius-control`    | `6px`                              |
| `nav-pitch`         | `36px`                             |
| `bottom-nav-height` | `64px` + safe-area                 |

### 3.5 Elevação

Sem sombra em repouso. Hierarquia: `ground` → `surface` → `raised`, mais `border`/`rule`.

## 4. Temas e preferência do sistema

- Preferências: `light` | `dark` | `system`.
- `system` segue `prefers-color-scheme`.
- Classe `.dark` no `html` ativa o tema escuro.
- `color-scheme: light|dark` no `html` para scrollbars/inputs nativos.
- Toggle acessível nas Configurações (demo nesta etapa).

## 5. Layout

### Desktop (≥1024px)

- Shell **open plane**: sidebar `240px` no `ground`, canvas fluido com gutter `24–32px`.
- Sem top bar global. Título da tela vive no canvas.
- Nav ativa: pill `accent-soft` + ícone `accent` + texto `accent-ink`.
- Brand + nome do workspace no topo da sidebar; utilidades (tema) na base.

### Mobile (<1024px)

- Sem sidebar.
- **Navegação inferior** fixa (`64px` + `env(safe-area-inset-bottom)`), 3 destinos.
- Conteúdo com padding inferior para não cobrir a nav.
- Margens laterais `16px`.

### Rotas

| Rota             | Papel nesta etapa                       |
| ---------------- | --------------------------------------- |
| `/`              | Dashboard demo (resumo + fita + tabela) |
| `/historico`     | Lista mensal fictícia + empty state     |
| `/configuracoes` | Campos, tema, jornada demo              |

## 6. Componentes compartilhados

### Botões

- `primary`: fundo `accent`, texto branco (claro) / `ground` (escuro); altura `36px`.
- `secondary` / `outline`: borda `border`, fundo `surface`.
- `ghost`: hover `raised`.
- `destructive`: texto/borda `negative`.
- Estados: hover (tom +5%), active (press 1px), focus-visible ring `2px` `focus`, disabled 50% opacity.
- Ícone sozinho exige `aria-label`.

### Indicadores de status (`StatusIndicator`)

| Status     | Significado     | Visual             |
| ---------- | --------------- | ------------------ |
| `idle`     | Fora de jornada | Dot muted          |
| `working`  | Em expediente   | Dot accent + label |
| `on_break` | Intervalo       | Dot warning        |
| `done`     | Jornada fechada | Dot positive       |
| `error`    | Inconsistência  | Dot negative       |

Sem ícones em quadrados tingidos.

### Campo de horário (`TimeField`)

- `input type="time"` estilizado, label associada, `tabular-nums`.
- Altura `36px`, raio `6px`, borda `control`.
- Erro: borda `negative` + texto de ajuda `aria-describedby`.

### Seletor de data (`DateField`)

- `input type="date"` estilizado (acessível nativo).
- Mesmo tratamento visual do `TimeField`.
- Formatação exibida via `Intl.DateTimeFormat('pt-BR')` quando houver texto auxiliar.

### Card de resumo (`SummaryCard`)

- Fundo `surface`, borda `border`, raio `8px`, padding `16–20px`.
- Label `12–13px` muted; valor `24px` tabular; caption com baseline (“vs. jornada de 8h”).
- Sem sparkline, sem ícone colorido.

### Tabela (`DataTable`)

- Sem card externo obrigatório; header sentence-case muted `12–13px`.
- Linhas `48px`, regras `1px` `rule`.
- Números à direita, `tabular-nums`.
- Uma marca de status por linha.

### Estado vazio (`EmptyState`)

- Título curto + uma frase + ação opcional.
- Sem ilustrações genéricas; pode usar ícone outline muted `24px`.

### Fita de marcações (`PunchStrip`) — assinatura

- Quatro slots: Entrada · Intervalo · Retorno · Saída.
- Horários em `fs-clock` tabular; slot vazio mostra `—`.
- Slot atual pode usar underline `2px` `accent`.

## 7. Estados visuais e interativos

| Estado                | Regra                                                        |
| --------------------- | ------------------------------------------------------------ |
| Hover                 | Fundo `raised` ou escurecimento leve do accent               |
| Focus-visible         | Ring `2px` + offset; nunca `outline: none` sem substituto    |
| Selected / active nav | `accent-soft`                                                |
| Disabled              | Opacity `0.5`, `pointer-events: none`                        |
| Loading               | Texto “Carregando…” + `aria-busy` (sem skeleton ornamentado) |
| Error                 | Inline ao lado do campo; mensagem com próximo passo          |
| Empty                 | `EmptyState` mantém o frame da seção                         |
| Zero                  | Mostrar `0`, não esconder                                    |
| Ausente               | Em dash `—` muted                                            |

## 8. Movimento

- Só `transform` / `opacity`.
- Respeitar `prefers-reduced-motion: reduce`.
- Transições curtas (`120–180ms`) em hover/tema.
- Nunca `transition: all`.

## 9. Acessibilidade e responsividade

- Skip link para `#conteudo-principal`.
- Landmarks: `nav`, `main`, headings hierárquicos.
- Contraste AA mínimo texto/fundo.
- Alvos tocáveis ≥ `44px` na bottom nav.
- Labels em todos os campos; ícones decorativos com `aria-hidden`.
- Breakpoints: mobile `<1024`; desktop `≥1024`.
- Safe areas em notches.

## 10. Anti-padrões (não fazer)

- Gradientes, glows, glassmorphism.
- Roxo/índigo como accent (ban taste-skill).
- KPI com ícone em círculo tingido ou sparkline.
- Cards com sombra empilhada.
- Inter / Roboto / Arial como face principal.
- Fundo cream genérico + terracota (viés AI).
- Lorem, Acme, John Doe.
- Lógica real de ponto nesta etapa — apenas dados fictícios de demonstração.

## 11. Dados fictícios de demo

Usar nomes e horários brasileiros coerentes (ex.: Ana Ribeiro, 08:02–12:01 / 13:02–17:08). Totais e captions devem bater entre si na mesma tela.

## 12. Checklist de implementação

- [x] Tokens CSS claro/escuro
- [x] Tema system/light/dark
- [x] Shell sidebar + bottom nav
- [x] Componentes compartilhados listados
- [x] Páginas demo com dados fictícios
- [ ] Revisão contínua contra este arquivo a cada tela nova
