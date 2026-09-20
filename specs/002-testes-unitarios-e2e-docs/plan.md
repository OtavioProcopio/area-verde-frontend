# Plano de implementação — Testes unitários de API/mappers, scripts E2E e atualização de documentação

> Descreve **como**. Deriva da spec e da constituição; não introduz requisito novo.

## Decisões técnicas

| Decisão | Escolha | Alternativas descartadas | Por quê |
|---|---|---|---|
| Onde ficam os testes novos | Espelhados em `app/tests/unit/src/<mesmo caminho relativo a src/>` (ex.: `app/tests/unit/src/lib/api/client.test.ts`, `app/tests/unit/src/features/products/mappers/productMapper.test.ts`), importando o arquivo testado via alias `@/...` | Colocar ao lado do arquivo testado, como os testes de hook pré-existentes faziam | O guard-hook estrutural do plugin (`guard_structure.py`) bloqueia qualquer teste fora de `app/tests/`, aplicando o Princípio 2 da constituição literalmente. Corrigido nesta feature: os 10 testes de hook/componente pré-existentes (colocados) foram movidos para o mesmo padrão espelhado, com os imports relativos trocados pelo alias `@` (já configurado em `vite.config.ts`, `resolve.alias['@'] = src/`) pra não depender de profundidade de pasta. |
| Como mockar `fetch` no teste de `apiRequest` | `vi.stubGlobal('fetch', vi.fn())` por teste, retornando um `Response`-like (`{ status, text: async () => ... }`) | MSW (Mock Service Worker) | Princípio 7 fecha a stack (proíbe libs novas sem justificativa); `vi.fn()` já resolve os 4 cenários pedidos sem dependência nova. |
| Onde entra o cenário de caixa fechado + captura de console error | Novo teste em `e2e/caixa-fluxos.spec.ts` (já é o arquivo do domínio caixa) | Arquivo novo `e2e/dashboard-fluxos.spec.ts` | Mesmo domínio de `caixa-fluxos.spec.ts`; criar arquivo novo pra um teste só fragmentaria a suíte sem ganho. |
| Onde entra a captura de console error | Helper novo em `e2e/helpers.ts` (`expectNoConsoleErrors(page)` ou equivalente), usado só no teste novo | Adicionar em todos os 10 arquivos E2E | Fora de escopo da spec — só o cenário novo pede isso explicitamente. |
| Scripts de E2E | `test:e2e` → `playwright test`, `test:e2e:ui` → `playwright test --ui`, `test:e2e:report` → `playwright show-report` | Um único script `test:e2e` com flags manuais | A issue #11 pede os três nomes explicitamente. |

## Padrões de projeto aplicados

Nenhum padrão GoF novo — é teste de função pura (mapper) e de cliente HTTP, sem estado nem
injeção de dependência além do mock de `fetch`. Considerado e recusado: nenhum, o problema não
pede abstração adicional (Princípio 4 — simplicidade defensável).

## Arquivos a criar ou alterar

| Camada | Arquivo | Ação | Teste espelhado |
|---|---|---|---|
| lib/api | `app/src/lib/api/client.ts` | nenhuma alteração de produção | `app/tests/unit/src/lib/api/client.test.ts` (criar) |
| features/products | `app/src/features/products/mappers/productMapper.ts` | nenhuma alteração | `app/tests/unit/src/features/products/mappers/productMapper.test.ts` (criar) |
| features/categories | `app/src/features/categories/mappers/categoryMapper.ts` | nenhuma alteração | `app/tests/unit/src/features/categories/mappers/categoryMapper.test.ts` (criar) |
| features/customers | `app/src/features/customers/mappers/customerMapper.ts` | nenhuma alteração | `app/tests/unit/src/features/customers/mappers/customerMapper.test.ts` (criar) |
| features/comandas | `app/src/features/comandas/mappers/comandaMapper.ts` | nenhuma alteração | `app/tests/unit/src/features/comandas/mappers/comandaMapper.test.ts` (criar) |
| features/caixa | `app/src/features/caixa/mappers/caixaMapper.ts` | nenhuma alteração | `app/tests/unit/src/features/caixa/mappers/caixaMapper.test.ts` (criar) |
| features/fiados | `app/src/features/fiados/mappers/fiadoMapper.ts` | nenhuma alteração | `app/tests/unit/src/features/fiados/mappers/fiadoMapper.test.ts` (criar) |
| testes pré-existentes | 10 arquivos `*.test.ts(x)` hoje colocados (hooks de caixa/categorias/comandas/customers/fiados/products, `Login`, `DatePicker`, `ToastStack`, `ToastContext`) | mover (`git mv`) para `app/tests/unit/src/<mesmo caminho>`, trocando imports relativos por `@/...` | — (o próprio arquivo é o teste) |
| config | `app/package.json` | adicionar scripts `test:e2e`, `test:e2e:ui`, `test:e2e:report` | — (config, não código de produção) |
| e2e | `app/e2e/helpers.ts` | adicionar helper de captura de console error | — (o helper É a infraestrutura de teste) |
| e2e | `app/e2e/caixa-fluxos.spec.ts` | adicionar cenário de caixa fechado usando o helper novo | — |
| docs | `README.md` (raiz) | reescrever | — |
| docs | `app/README.md` | reescrever seção Estrutura + nova seção Testes | — |
| docs | `docs/mapa-fluxos-e-cobertura-testes.md` | corrigir nota desatualizada sobre Configurações/PIN | — |

Nenhum arquivo de produção muda — só ganham teste direto. Não há `app/interfaces/` novo porque
não há injeção de dependência nova (mapper é função pura; `apiRequest` já é a única abstração
sobre `fetch`, conforme Princípio 10).

## Contrato entre camadas

Inalterado. Os testes novos chamam os mesmos mappers/`apiRequest` que hooks e services já
chamam hoje — nenhuma função de produção muda de assinatura ou comportamento.

## Dependências externas

Nenhuma dependência nova. `@playwright/test` já está instalado (`app/package.json`,
devDependencies); os scripts novos só expõem comandos que já funcionam via `npx playwright test`.

## Impacto no contrato de operação

Este repo **tem** Makefile como contrato de operação (`app/Makefile`, cada alvo chamando o
script npm correspondente). Três alvos novos: `make test-e2e`, `make test-e2e-ui`,
`make test-e2e-report`, espelhando os scripts novos do `package.json`. Não entram em
`make validate`/`make check` (que continuam sem depender de API real de pé), por decisão já
registrada na spec (E2E fica de fora do CI). Nenhum serviço novo no compose.

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Cobertura de 80% não bater em algum mapper por causa de branch não coberto (ex.: campo opcional) | Baixa | Cobrir explicitamente os campos opcionais/nulos de cada `Api*` type nos casos de teste |
| Teste de `apiRequest` acoplado demais ao formato do mock de `Response`, quebrando se o client mudar de biblioteca HTTP | Baixa | Mock mínimo (`status`, `text()`) — só o que `apiRequest` de fato usa |
| Cenário E2E de caixa fechado ficar flaky por depender de estado prévio do banco de dev | Média | Fechar qualquer caixa aberto via API antes do teste (mesmo padrão já usado em `fluxo-atendimento-bar.spec.ts` com `apiFecharCaixaForcado`) |

## Conformidade com a constituição

| Princípio | Como este plano o respeita |
|---|---|
| Contrato de operação | Os 3 scripts novos (`test:e2e`, `test:e2e:ui`, `test:e2e:report`) ganham alvo correspondente no `Makefile` (`make test-e2e` etc.), como todo outro script do projeto. |
| Arquitetura limpa | Código de produção segue `features/<domínio>/{hooks,services,mappers}` (Princípio 9) com camada de API única (Princípio 10); testes seguem `app/tests/unit/` espelhando `app/src/`, conforme o Princípio 2 e o guard-hook estrutural do plugin. Nenhum arquivo de produção fica fora de `app/src/`, nenhum teste fica fora de `app/tests/`. |
| Testes provam a entrega | Todo teste novo é atômico (um `it()` por caso), Arrange/Act/Assert, mock de `fetch` explícito (Princípio 11 — nada bate em API real), cobertura alvo declarada na spec (RNF-01). |
| Simplicidade defensável | Nenhuma lib nova, nenhum padrão GoF introduzido — a issue pedia teste direto de função pura, e é isso que o plano entrega. |
