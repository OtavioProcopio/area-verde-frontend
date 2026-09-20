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
