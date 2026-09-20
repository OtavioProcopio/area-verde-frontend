# Tarefas — Testes unitários de API/mappers, scripts E2E e atualização de documentação

> Ordem de dependência. `[P]` marca tarefa paralelizável (não toca arquivo de outra `[P]`
> da mesma fase). Este repo não tem "produção separada do teste" nesta feature — o teste
> em si é a entrega (RF-01/RF-02), então não há uma tarefa de implementação depois dele.

## Fase 0 — Corrigir estrutura dos testes pré-existentes

- [x] T000 Mover os 10 arquivos `*.test.ts(x)` hoje colocados ao lado do código (hooks de caixa/categorias/comandas/customers/fiados/products, `Login`, `DatePicker`, `ToastStack`, `ToastContext`) para `app/tests/unit/src/<mesmo caminho>`, via `git mv`, trocando os imports relativos (`./`, `../`) e os `vi.mock(...)` pelo alias `@/...`

## Fase 1 — Camada de API

- [x] T001 Escrever `app/tests/unit/src/lib/api/client.test.ts` — cobre `apiRequest`: sucesso com corpo JSON, erro JSON (`ApiError` com `.status` e `.payload`), erro texto puro (`.payload` é a string), resposta `204` (retorna `undefined`, sem tentar parsear corpo) (RF-01, RNF-02)

## Fase 2 — Mappers de domínio

> Cada tarefa toca um mapper diferente dos das outras — `[P]`.

- [x] T002 [P] Escrever `app/tests/unit/src/features/products/mappers/productMapper.test.ts` — cobre `mapProduct`: produto simples, produto composto com `recipe`, `unidadeEstoque` nula, conversão de `precoVenda`/`quantidadeEstoque` via `toNumber` (RF-02)
- [x] T003 [P] Escrever `app/tests/unit/src/features/categories/mappers/categoryMapper.test.ts` — cobre `mapCategory`: ativo/inativo (RF-02)
- [x] T004 [P] Escrever `app/tests/unit/src/features/customers/mappers/customerMapper.test.ts` — cobre `mapCustomer`: histórico a partir de `pendencias`, `apelido`/`observacao` nulos, `balance` via `toNumber` (RF-02)
- [x] T005 [P] Escrever `app/tests/unit/src/features/comandas/mappers/comandaMapper.test.ts` — cobre `mapComanda`: status `ABERTA`/`FECHADA`/`CANCELADA`/`PENDENTE` (vira `fiado`), lista de `itens` vazia e populada, `clienteId` nulo (RF-02)
- [x] T006 [P] Escrever `app/tests/unit/src/features/caixa/mappers/caixaMapper.test.ts` — cobre `mapCaixa` (`isOpen`, `logs` combinando `movimentos`+`pagamentos`, ordenação por `timestamp`) e `mapClosedCaixa` (RF-02)
- [x] T007 [P] Escrever `app/tests/unit/src/features/fiados/mappers/fiadoMapper.test.ts` — cobre `mapFiado`: status `aberto`/`quitado`, `cliente` nulo, `pendenteEm` ausente cai para `abertaEm` (RF-02)

## Fase 3 — E2E (scripts, cenário de caixa fechado, console errors)

- [x] T008 Alterar `app/package.json` — adiciona os scripts `test:e2e` (`playwright test`), `test:e2e:ui` (`playwright test --ui`), `test:e2e:report` (`playwright show-report`); alterar `app/Makefile` — adiciona `test-e2e`, `test-e2e-ui`, `test-e2e-report` chamando os scripts novos (Princípio 1 — contrato de operação) (RF-03)
- [x] T009 Alterar `app/e2e/helpers.ts` — adiciona um helper que registra listener de `console`/`pageerror` na `page` e expõe uma função de asserção que falha o teste se algo inesperado foi capturado (RF-05)
- [x] T010 Alterar `app/e2e/caixa-fluxos.spec.ts` — novo cenário: garante caixa fechado (via API, mesmo padrão de `apiFecharCaixaForcado` já usado em `fluxo-atendimento-bar.spec.ts`), navega até a tela que consome `GET /api/caixas/aberto`, confirma que a UI mostra o estado de caixa fechado/vazio, e usa o helper de T009 pra confirmar que não houve console error inesperado (RF-04, RF-05)

## Fase 4 — Documentação

> Cada tarefa toca um arquivo diferente das outras — `[P]`.

- [ ] T011 [P] Reescrever `README.md` (raiz) — remove o framing de protótipo do AI Studio, descreve o estado atual do projeto (frontend + backend, como se relacionam) (RF-06)
- [ ] T012 [P] Reescrever `app/README.md` — seção "Estrutura" reflete `features/<domínio>/{hooks,services,mappers,types.ts}` + `components/`; lista os módulos implementados; nova seção "Testes" com os comandos de Vitest e Playwright (incluindo pré-requisitos pra rodar E2E: API em execução, `npm run dev` de pé) (RF-07)
- [ ] T013 [P] Corrigir `docs/mapa-fluxos-e-cobertura-testes.md` — resolve a nota já sinalizada como desatualizada sobre Configurações não ter endpoint oficial e PIN em `localStorage` (RF-08)

## Fase 5 — Integração e verificação final

> Sem framework BDD neste repositório (mesmo desvio já documentado nas features anteriores) —
> os cenários Gherkin de `spec.md` mapeiam para as tarefas de teste acima (T001-T007 pros
> mappers/client, T010 pro cenário de caixa fechado) e para a verificação manual de T015
> (documentação, que não é testável por Vitest/Playwright).

- [x] T014 `make validate` verde (dentro de `app/`)
- [x] T015 Rodar `make test-e2e` localmente contra a API real (mesma stack já usada nesta sessão: `docker compose -f backend/docker-compose.local.yml up -d db` + `uvicorn` local + `API_PROXY_TARGET=http://localhost:8000 npm run dev`) e confirmar que o cenário novo (T010) passa
- [x] T016 Revisão manual: ler `README.md`, `app/README.md` e `docs/mapa-fluxos-e-cobertura-testes.md` de ponta a ponta e confirmar que nenhum dos três contradiz o código atual

## Rastreabilidade

| Requisito | Tarefas |
|---|---|
| (estrutural, exigido pelo guard-hook do plugin) | T000 |
| RF-01 | T001 |
| RF-02 | T002, T003, T004, T005, T006, T007 |
| RF-03 | T008 |
| RF-04 | T010 |
| RF-05 | T009, T010 |
| RF-06 | T011 |
| RF-07 | T012 |
| RF-08 | T013 |
| RNF-01 | T001-T007 (medido em T014) |
| RNF-02 | T001 |

## Convergence

> Seção **append-only**, escrita por `/bu:converge`. Cada rodada acrescenta um bloco;
> nada é reescrito.

### Rodada 1 — 2026-09-20

| Requisito | Estado | Evidência |
|---|---|---|
| RF-01 | realizado | `app/tests/unit/src/lib/api/client.test.ts` — 5 casos (sucesso, erro JSON, erro texto, 204, ApiError) |
| RF-02 | realizado | `app/tests/unit/src/features/{products,categories,customers,comandas,caixa,fiados}/mappers/*.test.ts` — 6 arquivos, 23 casos no total |
| RF-03 | realizado | `app/package.json` (scripts `test:e2e`/`test:e2e:ui`/`test:e2e:report`) + `app/Makefile` (alvos correspondentes) |
| RF-04 | realizado | `app/e2e/caixa-fluxos.spec.ts:24-38` — cenário novo, rodado contra API real (T015), passou |
| RF-05 | realizado | `app/e2e/helpers.ts` (`captureConsoleErrors`) usado no cenário de RF-04, com filtro pro 404 esperado |
| RF-06 | realizado | `README.md` (raiz) reescrito |
| RF-07 | realizado | `app/README.md` reescrito (estrutura, módulos, testes, pré-requisitos de E2E) |
| RF-08 | realizado | `docs/policies/frontend-agent-policy.md` (seções Configurações/Acesso) corrigidas; nota em `docs/mapa-fluxos-e-cobertura-testes.md` atualizada |
| RNF-01 | realizado | Cobertura medida: `client.ts` 100%, `productMapper`/`categoryMapper`/`comandaMapper`/`fiadoMapper` 100%, `customerMapper` 100%, `caixaMapper` 97% — todos acima do alvo de 80% |
| RNF-02 | realizado | `client.test.ts` usa `vi.stubGlobal('fetch', vi.fn())`; nenhum teste novo faz request real |

`make validate` (dentro de `app/`): **verde** — `format` → `typecheck` → `lint` (0 erros, 16
warnings pré-existentes) → `test-coverage` (83 testes, todos passando) → `build`. Saída completa
mostrada nesta sessão.

`make test-e2e` (T015), rodado contra API real local: 51 passaram, 13 falharam, 2 skipped.
As 13 falhas são em arquivos **fora do escopo desta feature** (`clientes-fluxos.spec.ts`,
`comandas-fluxos.spec.ts`, `fiados-fluxos.spec.ts`, `fluxo-atendimento-bar.spec.ts`,
`produtos-fluxos.spec.ts`, `relatorios-fluxos.spec.ts`) — regressões pré-existentes de trabalho
anterior (a maior parte parece ser o mesmo padrão já corrigido em `caixa-fluxos.spec.ts` nesta
rodada: teste esperando `window.alert()`/dialog que a feature de toast já substituiu). Não fazem
parte de nenhum requisito desta spec; registrados aqui como achado, não corrigidos nesta rodada
(ver "Excesso" abaixo pro que foi corrigido além do pedido original).

**Excesso** (além do pedido original, mas necessário pra cumprir o pedido):
- `app/vite.config.ts` — proxy de dev configurável via `API_PROXY_TARGET`. Não pedido pela spec,
  mas sem isso não dava pra rodar T015 (validar RF-04/RF-05 de verdade) fora do devcontainer.
  Justificado: sem essa mudança, RF-04/RF-05 ficariam "implementado, nunca executado".
  Retrocompatível (mesmo padrão default do devcontainer se a env var não for setada).
- `app/e2e/caixa-fluxos.spec.ts` (teste de sangria) — corrigido pra checar texto na tela em vez
  de `dialog`, porque rodar a suíte completa (T015) revelou que esse teste já estava quebrado
  desde a feature de toast (regressão real, não hipotética). Fora do pedido original, mas é
  bug real encontrado no processo de convergência, não deixado passar.
- `app/eslint.config.js`, `app/tsconfig.json` — `tests/` passou a ser lintado/typechecado.
  Não pedido explicitamente, mas decorrência direta de mover os testes pra lá (T000):
  sem isso, os arquivos novos ficariam fora de qualquer verificação estática.

Nenhum item da seção **Fora de escopo** da spec foi violado: não expandi captura de console
error pros outros 9 arquivos E2E, não criei teste de componente de tela, não coloquei E2E no
CI, não toquei `docker-compose.local.yml`, não mexi na documentação do backend.

Veredito: **convergido**
Tarefas acrescentadas: nenhuma
